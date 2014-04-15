
var debug = require('debug')('server:index');
var jenkins = require('../lib/jenkins');
var xml2js = require('xml2js');
var request = require('request');
var moment = require('moment');

var Job = require('../lib/job');

var phantomas = require('phantomas');
var metadata = phantomas.metadata;
var metrics = Object.keys(metadata.metrics).sort().map(function(key) {
  var metric = metadata.metrics[key];
  metric.name = key;
  return metric;
});

var config = require('../package.json').config;
var request = require('request');

exports.api = require('./api');

/*
 * GET home page.
 */

exports.index = function(req, res, next) {
  debug('Index', req.url);
  jenkins.all(function(err, jobs) {
    if (err) return next(err);
    debug('Render all', jobs);

    jobs.forEach(function(job) {
      job.animated = /anime/.test(job.color);
    });

    res.render('index', { jobs: jobs, config: config });
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
      data.runUrl = '/create/run-feature/';
    }

    res.render(template, data);
  });
};

exports.view = function view(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.edit = false;
    res.render('view', data);
  });
};

exports.har = function har(req, res, next) {
  var name = req.params.name;
  var number = req.params.number;
  var url = req.params.url;

  var jenkinsHarUrl = (config.jenkins).replace(/:\/\/\w.+:\w+@/, '://') + 'job/' + name + '/ws/results/' + number + '/' + url + '/har.json';
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
    if (!last) return next(new Error('Error getting last build info'));

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

exports.buildView = buildView;

// Build view request handler, for both normal view and last job view
// TODO: Rework me...
function buildView(req, res, next) {
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
          localHar: '/har/' + data.job.name + '/' + data.number + '/' + id + '.json',
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
}

function requestJobLog(name, number, done) {
  request(config.jenkins + '/job/' + name + '/' + number + '/consoleText', done);
}

// Helper to cleanup URL for filesystem I/O or graphite keys
function cleanUrl(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/g, '')
    .replace(/(\/|\?|-|&amp;|=|\.)/g, '_');
}

/*
 * GET delete job
 */

exports.destroy = function destroy(req, res, next) {
  var name = req.params.name;
  jenkins.job.delete(name, function(err) {
    if (err) return next(err);
    debug('Jenkins job deletion OK');
    res.redirect('/');
  });
};
