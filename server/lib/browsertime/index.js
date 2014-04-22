var fs      = require('fs');
var path    = require('path');
var express = require('express');
var debug   = require('debug')('server:browsertime');
var request = require('request');
var Job     = require('../job');

var routes = require('../../routes');
var config = require('../../package.json').config;

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

    var url = config.jenkins + 'job/' + name + '/ws/';

    // Displayed URL
    data.url = url.replace(config.jenkins, config.jenkinsUrl.protocol + '//' + config.jenkinsHost);

    request(url, function(err, response, metrics) {
      if (err) return next(err);
      if (response.statusCode !== 200) metrics = '{}';
      data.metrics = {};

      try {
        data.metrics = JSON.parse(metrics);
      } catch(e) {}

      data.metricsJSON = metrics;
      res.render('bt-metrics', data);
    });
  });
});

// TODO: To port over here
app.get('/view/:name/asserts/:metric', routes.metric);
app.get('/view/:name/metrics/:metric', routes.metric);
app.post('/view/:name/asserts/:metric', routes.api.metric);
app.post('/view/:name/metrics/:metric', routes.api.metric);
app.post('/view/:name/asserts/:metric/del', routes.api.metricDelete);
app.post('/view/:name/metrics/:metric/del', routes.api.metricDelete);

// Must come after asserts, or will route will clash
app.get('/view/:name/:number', routes.buildView);
