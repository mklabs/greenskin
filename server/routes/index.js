
var debug = require('debug')('server:index');
var jenkins = require('../lib/jenkins');
var xml2js = require('xml2js');
var request = require('request');

var Job = require('../lib/job');

var phantomas = require('phantomas');
var metadata = phantomas.metadata;
var metrics = Object.keys(metadata.metrics).sort().map(function(key) {
  var metric = metadata.metrics[key];
  metric.name = key;
  return metric;
});

var config = require('../package.json').config;

exports.api = require('./api');

/*
 * GET home page.
 */

exports.index = function(req, res, next) {
  debug('Index', req.url);
  jenkins.all(function(err, jobs) {
    if (err) return next(err);
    debug('Render all', jobs);
    res.render('index', { jobs: jobs });
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
    res.render('create', data);
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

exports.buildView = function buildView(req, res, next) {
  var name = req.params.name;
  var number = req.params.number;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.edit = false;
    data.number = number;

    var jenkinsBase = (config.jenkins).replace(/:\/\/\w.+:\w+@/, '://') + 'job/' + data.job.name + '/ws/results/' + data.number + '/';

    data.config = config;
    data.job._urls = [];

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
};


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
