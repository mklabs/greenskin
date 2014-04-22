var fs      = require('fs');
var path    = require('path');
var express = require('express');
var debug   = require('debug')('server:browsertime');
var request = require('request');
var Job     = require('../job');

var async = require('async');

var routes  = require('../../routes');
var helpers = require('../helpers');
var config  = require('../../package.json').config;

var xmlTemplate = fs.readFileSync(path.join(__dirname, 'config.xml'), 'utf8');

// Express subapp
var app = module.exports = express();

// Trigger here any initialization logic
app.on('mount', function(parent) {
  debug('Browsertime subapp mounted');
  // Attach websocket instance for access later on in routes
  app.ws = parent.ws;

  // Adding ./views to parent app view system
  parent.addViews(path.join(__dirname, 'views'));

  // Adding buttons
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (Browsertime)',
    url: '/bt/create'
  });
});

function noopware(req, res, next) {
  debug('Not yet implemented', req.url);
  next();
}

app.get('/view/:name', routes.view);

app.get('/create', function(req, res, next) {
  var job = new Job('', next, {
    xml: xmlTemplate
  });

  job.on('end', function(data) {
    data.title = 'Create job (Browsertime)';
    data.action = '/api/create';
    data.job.namespace = 'bt';

    // Big hack, needs to refactor api#create to work with config.xml
    // stored in subapps
    data.job.type = '../lib/browsertime/config';
    res.render('form', data);
  });

});

app.get('/edit/:name', function edit(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.action = '/api/edit';
    data.edit = true;
    res.render('form', data);
  });
});


app.get('/view/:name/metrics', function(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.edit = false;

    var wsUrl = config.jenkins + 'job/' + name + '/ws/';
    var number = data.job.lastSuccessfulBuild && data.job.lastSuccessfulBuild.number;
    if (isNaN(number)) return next(new Error('Cannot get last sucessfull build number'));

    // Displayed URL
    data.url = wsUrl.replace(config.jenkins, config.jenkinsUrl.protocol + '//' + config.jenkinsHost);

    var urls = data.job.urls || [];
    buildMetricData(name, number, urls, function(err, metrics) {
      if (err) return next(err);
      data.metrics = metrics;
      res.render('bt-metrics', data);
    });
  });
});

app.get('/view/:name/:number', function(req, res, next) {
  var name = req.params.name;
  var number = parseInt(req.params.number, 10);

  if (isNaN(number)) return next(new Error('Build "' + req.params.number + '" not a valid number'));

  var job = new Job(name, next);
  job.on('end', function(data) {

    helpers.requestJobLog(name, number, function(err, response, body) {
      if (err) return next(err);
      data.job.log = body;
      data.number = number;

      var urls = data.job.urls || [];
      buildMetricData(name, number, urls, function(err, metrics) {
        if (err) return next(err);
        data.metrics = metrics;
        return res.render('bt-build', data);
      });
    });
  });
});

// TODO: Probably to put in an helper file
function buildMetricData(name, number, urls, next) {
  // Get URL specific metrics.json
  var metrics = [];

  var wsUrl = config.jenkins + 'job/' + name + '/ws/';
  var displayUrl = wsUrl.replace(config.jenkins, config.jenkinsUrl.protocol + '//' + config.jenkinsHost);

  async.each(urls, function(url, done) {
    var cleanedUrl = helpers.cleanUrl(url);
    var jsonUrl = wsUrl + 'results/' + number + '/' + cleanedUrl + '/metrics.json';

    request(jsonUrl, function(err, response, body) {
      if (err) return done(err);

      var metricData = {
        url: url,
        key: cleanedUrl,
        file: displayUrl + 'results/' + number + '/' + cleanedUrl + '/metrics.json',
        json: body
      };

      metricData.metrics = {};
      try {
        metricData.metrics = JSON.parse(body);
        metricData.metrics.timingRuns = metricData.metrics.timingRuns.map(function(timingRun) {
          timingRun.timings = timingRun.marks.reduce(function(a, b) {
            a[b.name] = b.startTime;
            return a;
          }, {});

          timingRun.timingsJSON = JSON.stringify(timingRun.timings);

          return timingRun;
        });

        metricData.pageDataJSON = JSON.stringify(metricData.metrics.pageData, null, 2);
      } catch(e) {}

      metrics.push(metricData);
      done(null, metricData);
    });
  }, function(err) {
    if (err) return next(err);
    next(null, metrics);
  });
}
