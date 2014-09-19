var fs      = require('fs');
var path    = require('path');
var express = require('express');
var debug   = require('debug')('server:feature');
var helpers = require('./helpers');
var directory = require('serve-index');

// Untill routes for phantomas jobs are ported over here, and better
// isolated from the rest of the app
var routes = require('./routes/common');

// Express subapp
var app = module.exports = express();

// Used for running job locally
var tmpdir = path.join(__dirname, '../../tmp');

// Trigger here any initialization logic
app.on('mount', function(parent) {
  debug('Feature subapp mounted');
  // Attach websocket instance for access later on in routes
  app.ws = parent.ws;

  // Adding buttons
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (Functional)',
    url: '/feature/create'
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// For browsing temporary workspaces when running features
app.use('/tmp', express.static(tmpdir));
app.use('/tmp', directory(tmpdir));

app.get('/edit/:name', routes.edit);
app.get('/view/:name', routes.view);
app.get('/view/:name/:number', routes.buildView);
app.get('/edit/:name/steps.js', routes.serveStepfile);
app.get('/create/steps.js', function(req, res, next) {
  fs.createReadStream(path.join(__dirname, './mocha-webdriver-stepfile.js')).pipe(res);
});

// Main Routes
//
// TODO: Move functions definition into ./routes.js
// Job creation
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, 'mocha-webdriver-stepfile.js'), 'utf8');

app.post('/create', function(req, res, next) {
  var params = req.body;
  var name = params.name;
  var xml = params.xml;
  params.json = params.json_config || params.jsonconfig || params.config || '{}';

  var json;
  try {
    json = JSON.parse(params.json);
  } catch(e) {
    return next(e);
  }

  if (!(json.features && json.features.length)) return next(new Error('Missing features. Please specifiy at least one feature file to run.'));
  if (!name) return next(new Error('Missing name'));

  // Get back XML file from job template param
  fs.readFile(path.join(__dirname, './data', params.template + '.xml'), 'utf8', function(err, xml) {
    if (err) return next(err);

    var job = new app.parent.Job({
      name: name,
      xml: xml
    });

    if (params.cron) job.setCron(params.cron);
    if (params.json) job.setJSON(params.json);

    job.save()
      .on('error', next)
      .on('saved', function() {
        res.redirect('/');
      });
  });

});

app.get('/create', function(req, res, next) {
  var job = new app.parent.Job('', next, {
    xmlTemplate: 'feature'
  });

  var data = {};
  data.title = 'Create job';
  data.action = '/feature/create';
  data.runUrl = '/feature/create/run-feature/';
  data.job = {};
  data.job.json = JSON.stringify({
    steps: mochaSteps,
    features: []
  });
  res.render('create-feature', data);
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

  return helpers.runWebdriverFeature(app.ws, jobdata, function(err, data) {
    if (err) return next(err);
    res.json(data);
  });
});

// External process

// PhantomJS webdriver
var phantomjs = require('phantomjs').path;
var spawn = require('child_process').spawn;

var phantom = spawn(phantomjs, ['--webdriver=9134']);

phantom.stdout.pipe(process.stdout);
phantom.stderr.pipe(process.stderr);
