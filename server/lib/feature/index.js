var fs      = require('fs');
var path    = require('path');
var express = require('express');
var kue     = require('kue');
var debug   = require('debug')('server:feature');
var helpers = require('./helpers');
var Job     = require('../job');

// Untill routes for phantomas jobs are ported over here, and better
// isolated from the rest of the app
var routes = require('../../routes');

// Express subapp
var app = module.exports = express();

// Used for running job locally
var tmpdir = path.join(__dirname, '../../tmp');

// Trigger here any initialization logic
app.on('mount', function(parent) {
  debug('Feature subapp mounted');
  // Attach websocket instance for access later on in routes
  app.ws = parent.ws;

  // Kue state (TODO: Consider moving kue & redis init logic here)
  app.kue = parent.kue;

  debug('Init feature subapp', app.kue);
  if (app.kue) helpers.createQueue(app.ws);

  // Adding buttons
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (Functional)',
    url: '/f/create'
  });
});

// For browsing temporary workspaces when running features
app.use('/tmp', express.static(tmpdir));
app.use('/tmp', express.directory(tmpdir));

app.get('/edit/:name', routes.edit);
app.get('/view/:name', routes.view);
app.get('/view/:name/:number', routes.buildView);
app.get('/edit/:name/steps.js', routes.serveStepfile);
app.get('/create/steps.js', function(req, res, next) {
  fs.createReadStream(path.join(__dirname, '../../test/mocha-stepfile.js')).pipe(res);
});

// Main Routes
//
// TODO: Move functions definition into ./routes.js
// Job creation
app.get('/create', function(req, res, next) {
  var job = new Job('', next, {
    xmlTemplate: 'feature'
  });

  job.on('end', function(data) {
    data.title = 'Create job';
    data.action = '/api/create';
    data.runUrl = '/f/create/run-feature/';
    data.job.json = JSON.stringify(data.job.config);
    res.render('create-feature', data);
  });
});

app.post('/create/run-feature', function(req, res, next) {
  var params = req.body;
  var config = params.config;
  var timestamp = params.timestamp;

  var data = {};

  try {
    data = JSON.parse(config);
  } catch(e) {
    return next(e);
  }

  // normalize feature name, adding .feature extension if missing
  data.features = data.features.map(function(f) {
    f.name = path.extname(f.name) !== '.feature' ? f.name + '.feature' : f.name;
    return f;
  });

  if (!data.steps) {
    data.steps = mochaSteps;
  }

  var runtmpdir = path.join(tmpdir, timestamp);

  var jobdata = {
    title: 'PhantomJS feature running',
    runtmpdir: runtmpdir,
    timestamp: timestamp,
    data: data
  };

  debug('Creating job %s %d', jobdata.title, jobdata.timestamp);

  if (!app.kue) return runFeature(ws, jobdata, function(err, data) {
    if (err) return next(err);
    res.json(data);
  });

  var jobs = kue.createQueue();
  var job = jobs.create('phantom feature', jobdata).save();

  debug('Kue process %s %d', jobdata.title, jobdata.timestamp);
  job.on('complete', function(e) {
    debug('Job complete', runtmpdir);
    if (e) return next(e);
      fs.readdir(path.join(runtmpdir, 'step-screens'), function(err, files) {
        if (err) return next(err);
        res.json({
          timestamp: timestamp,
          workspace: '/f/tmp/' + timestamp,
          screens: files
        });
      });
  }).on('failed', function() {
    debug('Job failed', runtmpdir);
  }).on('progress', function(progress){
    debug('\r  job #' + job.id + ' ' + progress + '% complete');
  });
});
