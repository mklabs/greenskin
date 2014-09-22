

var debug = require('debug')('gs:server:index');
var xml2js = require('xml2js');
var request = require('request');
var moment = require('moment');

var async = require('async');

var Job = require('../../../lib/models/job');
var LastBuildPage = require('../../../lib/pages/last-build');

var helpers = require('../../../lib/helpers');
var cleanUrl = helpers.cleanUrl;
var requestJobLog = helpers.requestJobLog;

var phantomas = require('phantomas');
var metadata = phantomas.metadata;
var metrics = Object.keys(metadata.metrics).sort().map(function(key) {
  var metric = metadata.metrics[key];
  metric.name = key;
  return metric;
});

var config = require('../package.json').config;
var request = require('request');

// exports.api = require('./api');

/*
 * GET home page.
 */

var cache = {};
cache.jobs = {};
cache.builds = {};

exports.index = function(req, res, next) {
  jenkins.all(function(err, jobs) {
    if (err) return next(err);
    jobs.forEach(function(job) {
      job.animated = /anime/.test(job.color);

    });

    var response = [];
    async.forEach(jobs, function(j, done) {
      var name = j.name;

      if (cache.jobs[name]) {
        response.push(cache.jobs[name]);
        return done(null, cache.jobs[name]);
      }

      var instance = new Job(name, done);

      instance.on('end', function(data) {
        var job = data.job;
        var lastStable = job.lastSuccessfulBuild && job.lastSuccessfulBuild.number;
        var lastFailedBuild = job.lastFailedBuild && job.lastFailedBuild.number;
        var lastBuild = job.lastBuild && job.lastBuild.number;

        function getBuild(number, prop) {
          return function(done) {
            if (!number) return done();

            jenkins.build.get(name, number, function(err, data) {
              if (err) return done(err);
              data.moment = moment(data.timestamp).fromNow();
              data._duration = moment.duration(data.duration).humanize();
              job[prop] = data;
              done(null, data);
            });

          };
        }

        async.parallel([
          getBuild(lastStable, 'lastSuccessfulBuild'),
          getBuild(lastFailedBuild, 'lastFailedBuild'),
          getBuild(lastBuild, 'lastBuild')
        ], function(err, results) {
          if (err) return done(err);

          job.animated = /anime/.test(job.color);
          cache.jobs[name] = job;

          // Basic TTL of 5s
          setTimeout(function() {
            delete cache.jobs[name];
          }, 1000 * 5);

          response.push(job);
          done();
        });

      });
    }, function(err) {
      if (err) return next(err);

      response.sort(function(a, b) {
        return a.name > b.name;
      });

      res.render('index', { showqueue: true, jobs: response, config: config });
    });
  });
};


/*
 * GET create job page
 */

exports.create = function(req, res, next) {
  var job = new Job('', next);

  job.on('end', function(data) {
    data.title = 'Create job';
    data.action = '/api/create';
    res.render('create', data);
  });
};

/*
 * GET edit job page
 */

exports.edit = function edit(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.action = '/api/edit';
    data.edit = true;

    var template = 'create';
    if (data.job.feature) {
      template = 'create-feature';
      data.runUrl = '/f/create/run-feature/';
    }

    res.render(template, data);
  });
};

exports.serveStepfile = function serveStepfile(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(jobdata) {
    var json = jobdata.job.json;
    var data = {};
    try {
      data = JSON.parse(json);
    } catch(e) {
      return next(e);
    }

    var js = data.steps.map(function(step) {
      return step.body;
    }).join('\n\n');

    res.send(js);
  });

};

exports.view = function view(req, res, next) {
  var page = new LastBuildPage(req.params);

  page.on('error', next);
  page.on('next', next);
  page.on('end', function(data) {
    data.job.tabs = [{
      url: '/phantomas/' + req.params.name + '/metrics',
      text: 'Metrics'
    }, {
      url: '/phantomas/' + req.params.name + '/asserts',
      text: 'Asserts'
    }];

    res.render('view', data);
  });

  return;

  var name = req.params.name;
  var job = new Job({
    name: name
  });
  debug('View %s', name);
  job.on('end', function(data) {
    data.title = name;
    data.edit = false;

    debug('end', data);
    async.map(data.job.builds, function(build, done) {
      var number = build.number;
      var key = name + ':' + number;
      if (cache.builds[key]) return done(null, cache.builds[key]);
      jenkins.build.get(name, number, function(err, data) {
        if (err) return done(err);
        data.color = data.result === 'SUCCESS' ? 'blue' :
          data.result === 'FAILURE' ? 'red' :
          data.result === 'WARNING' ? 'yellow' :
          '';

        data.name = name;
        data.moment = moment(data.timestamp).format('llll');
        data.fromNow = moment(data.timestamp).fromNow();
        data.duration = moment.duration(data.duration).humanize();
        data.animated = /anime/i.test(data.result);

        cache.builds[key] = data;
        done(null, data);
      });
    }, function(err, builds) {
      if (err) return next(err);
      data.builds = builds;
      res.render('view', data);
    });
  });

  job.fetch();
};

exports.metrics = function metrics(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.edit = false;

    var assertMode = data.assertMode = /\/asserts$/.test(req.url);
    var metricsMode = data.metricsMode = /\/metrics$/.test(req.url);


    var url = config.jenkins + 'job/' + name + '/ws/metrics.json';
    request(url, function(err, response, metrics) {
      if (err) return next(err);
      if (response.statusCode !== 200) metrics = '{}';
      data.metrics = {};

      try {
        data.metrics = JSON.parse(metrics);
      } catch(e) {}

      data.metricsJSON = metrics;
      var keys = data.metricsKeys = Object.keys(data.metrics);

      var graphs = data.graphs = [];

      keys.forEach(function(key) {
        graphs.push({
          name: key,
          data: data.metrics[key],
          json: JSON.stringify(data.metrics[key])
        });
      });

      data.graphs = graphs;

      // Asserts is like graphs, but only with the configured asserts in
      // phantomas config, returning only the graphs related to monitored
      // metric.
      var asserts = Object.keys(data.job.config.asserts || {});
      data.asserts = data.graphs.filter(function(graph) {
        return !!~asserts.indexOf(graph.name);
      });

      data.url = url.replace(config.jenkins, config.jenkinsUrl.protocol + '//' + config.jenkinsHost);

      var monitoredMetrics = Object.keys(data.job.config.asserts || {});

      data.colsize = 4;
      if (assertMode) {
        data.graphs = graphs.filter(function(graph) {
          return !!~monitoredMetrics.indexOf(graph.name);
        }).map(function(graph) {
          graph.assert = data.job.config.asserts[graph.name];
          return graph;
        });

        data.colsize = 4;
        data.assertsJSON = JSON.stringify(data.job.config.asserts, null, 2);
      }

      res.render('metrics', data);
    });
  });
};


exports.metric = function _metric(req, res, next) {
  var name = req.params.name;
  var metric = req.params.metric;

  var url = config.jenkins + 'job/' + name + '/ws/metrics.json';
  request(url, function(err, response, metrics) {
    if (err) return next(err);
    if (response.statusCode !== 200) metrics = '{}';

    try {
      metrics = JSON.parse(metrics);
    } catch(e) {
      next(e);
      return;
    }

    var data = metrics[metric] || {};
    res.json(data);
  });
};

exports.har = function har(req, res, next) {
  var name = req.params.name;
  var number = req.params.number;
  var url = req.params.url;

  var jenkinsHarUrl = (config.jenkins).replace(/:\/\/\w.+:\w+@/, '://') + '/job/' + name + '/ws/results/' + number + '/' + url + '/har.json';
  req.pipe(request(jenkinsHarUrl)).pipe(res);
};

// http://192.168.33.11:8080/job/R8_perf_funky/buildWithParameters
exports.run = function run(req, res, next) {
  var name = req.params.name;
  var url = config.jenkins + 'job/' + name + '/buildWithParameters';
  request(url, function(err) {
    if (err) return next(err);
    res.redirect('/view/' + name + '/last?pending');
  });
};

exports.lastBuild = function lastBuild(req, res, next) {
  var name = req.params.name;
  var pending = typeof req.query.pending !== 'undefined';
  var job = new Job(name, next);

  job.on('end', function(data) {
    var last = data.job.lastBuild && data.job.lastBuild.number;
    if (!last) {
      debug(new Error('Error getting last build info'));
      return res.redirect('/');
    }

    data.config = config;
    data.json = JSON.stringify(data.job, null, 2);
    data.title = name;
    data.edit = false;
    data.last = true;
    data.pending = pending;

    data.animated = /anime/.test(data.job.color);

    jenkins.build.get(name, last, function(err, build) {
      if (err) return next(err);
      data.build = build;

      build.finished = moment(build.timestamp).fromNow();
      build._duration = moment.duration(build.duration).humanize();
      build.ws = config.jenkins + 'job/' + name + '/ws';

      requestJobLog(name, last, function(err, response, body) {
        if (err) return next(err);

        data.job.log = body;

        if (pending) {
          build.finished = '';
          build._duration = '';
          data.job.log = '... Waiting ...\n\nYou triggered a run, this page should reload as soon as build #' + data.job.nextBuildNumber + ' starts.\n\n';
          build.result = 'Waiting';
          data.job.lastBuild.number = data.job.nextBuildNumber;
          data.job.color = 'aborted';
        }

        res.render('build', data);
      });
    });
  });
};

// Build view request handler, for both normal view and last job view
// TODO: Rework me...
exports.buildView = function buildView(req, res, next) {
  var name = req.params.name;
  var number = parseInt(req.params.number, 10);

  if (isNaN(number)) return next('Build "' + req.params.number + '" not a valid number');

  var job = new Job(name, next);
  job.on('end', function(data) {
    data.title = name;
    data.edit = false;
    data.number = number;

    var jenkinsBase = (config.jenkins).replace(/:\/\/\w.+:\w+@/, '://') + 'job/' + data.job.name + '/ws/results/' + data.number + '/';

    data.config = config;
    data.job._urls = [];

    requestJobLog(name, number, function(err, response, body) {
      if (err) return next(err);

      data.job.log = body;

      // Async each on URLs to get the JSON file index from Jenkins workspace
      var urls = data.job.urls.concat();
      (function loop(url) {
        if (!url) {
          return res.render('build', data);
        }

        var id = cleanUrl(url);
        var fileindex = jenkinsBase + id + '/filmstrip/files.json';

        var urlData = {
          url: url,
          id: id,
          jenkinsHar: jenkinsBase + id + '/har.json',
          localHar: '/p/har/' + data.job.name + '/' + data.number + '/' + id + '.json',
          jenkinsFilmstripDir: jenkinsBase + id + '/filmstrip/',
          fileindex: fileindex
        };

        request(fileindex, { json: true }, function(err, res, response) {
          if (err) return next(err);

          function extractTime(obj) {
            var value = obj.split('-').slice(-1)[0].replace('.png', '');
            return parseInt(value, 10);
          }

          var files = Array.isArray(response) ? response : [];
          urlData.screenshots = files.map(function(file) {
            return {
              url: urlData.jenkinsFilmstripDir + file,
              time: extractTime(file)
            };
          }).sort(function(a, b) {
            return a.time > b.time;
          });

          data.job._urls.push(urlData);
          loop(urls.shift());
        });

      })(urls.shift());
    });
  });
};

exports.search = function search(req, res, next) {
  var val = '';
  if (req.body) val = req.body.query;
  if (!val && req.query) val = req.query.query;
  if (!val) return next(new Error('Missing val'));

  var jobs = Object.keys(cache.jobs).filter(function(key) {
    return !!~key.indexOf(val);
  }).map(function(key) {
    var job = cache.jobs[key];
    var result = job.lastBuild && job.lastBuild.result && job.lastBuild.result.toLowerCase();
    return {
      name: job.name,
      lastBuildStatus: result,
      lastBuildLabel: job.lastBuild && job.lastBuild.fullDisplayName,
      number: job.lastBuild && job.lastBuild.number,
      lastBuildTime: job.lastBuild && moment(job.lastBuild.timestamp).format('llll'),
      jobUrl: job.lastBuild && job.lastBuild.url,
      webUrl: '/' + job.namespace  + '/view/' + job.name + '/' + (job.lastBuild ? job.lastBuild.number : ''),
      duration: job.lastBuild && moment.duration(job.lastBuild.duration).humanize(),
      finished: job.lastBuild && moment(job.lastBuild.timestamp).fromNow(),
      color: /failure/.test(result) ? 'red' :
        /success/.test(result) ? 'green' :
        /abort/.test(result) ? 'gray' :
        /warn/.test(result)  ? 'yellow' :
        'gray',
      timestamp: job.lastBuild && job.lastBuild.timestamp
    };
  });

  res.json({
    val: val,
    jobs: jobs
  });

};

/*
 * GET delete job
 */

exports.destroy = function destroy(req, res, next) {
  var name = req.params.name;
  jenkins.job.delete(name, function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};
