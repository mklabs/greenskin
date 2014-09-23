var fs      = require('fs');
var path    = require('path');
var express = require('express');
var debug   = require('debug')('gs:server:feature');
var helpers = require('./helpers');
var request = require('request');

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

  debug('Initing partial dir');
  parent.hbs.registerPartials(path.join(__dirname, 'views/partials'));

  app.parent.Job.type('feature', function(xml) {
    return /mklabs\/wd-gherkin/.test(xml);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// For browsing temporary workspaces when running features
app.use('/tmp', express.static(tmpdir));
app.use('/tmp', directory(tmpdir));

app.get('/edit/:name/steps.js', routes.serveStepfile);

app.get('/:name/edit', function(req, res, next) {
  var job = new app.parent.Job({
    name: req.params.name
  });

  job.fetch().on('error', next);
  job.once('sync', function() {
    res.render('create-feature', {
      job: job.toJSON(),
      tabs: { edit: true },
      title: job.name,
      action: '/feature/' + req.params.name + '/edit',
      runUrl: '/feature/create/run-feature',
      edit: true
    });
  });
});

app.post('/:name/edit', function(req, res, next) {
  var params = req.body;
  var name = params.name;
  var xml = params.xml;

  if (!name) return next(new Error('Missing name'));

  var job = new app.parent.Job({
    name: name
  });

  job.fetch().on('error', next);
  job.once('sync', function() {
    job.setCron(params.cron);
    job.jsonConfig(params.json_config);

    job.save()
      .on('error', next)
      .on('saved', function() {
        // res.render('create-feature', {
        //   saved: true,
        //   job: job.toJSON(),
        //   tabs: { edit: true },
        //   title: job.name,
        //   action: '/feature/' + req.params.name + '/edit',
        //   runUrl: '/feature/create/run-feature',
        //   edit: true
        // });

        res.redirect('/feature/' + req.params.name + '/edit');
      });
  });

});

app.get('/:name/builds', function(req, res, next) {
  var name = req.params.name;

  var page = new app.parent.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', res.render.bind(res, 'builds'));
});

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

app.get('/:name', function(req, res, next) {
  var page = new app.parent.LastBuildPage(req.params);

  page.on('error', next);
  page.on('next', next);
  page.on('end', function(data) {
    res.render('view', data);
  });

});

app.get('/:name/:number', function(req, res, next) {
  var name = req.params.name;
  var num = req.params.number;
  if (isNaN(num)) return next();

  // Can extend that page, or do specialization here
  var page = new app.parent.BuildPage({
    name: name,
    number: num
  });

  page.on('error', next);
  page.on('end', function(data) {
    debug('Building har view for %s job', data.job.name);
    var fileurl = data.job.url + 'ws/files.txt';

    request(fileurl, function(err, response, body) {
      if (err) return next(err);
      if (response.statusCode !== 200) return next(new Error('Cannot find files.txt in workspace'));

      var screenshots = body.split(/\r?\n/).filter(function(file) {
        return path.extname(file) === '.png';
      }).sort().map(function(file) {
        return {
          url: data.job.url + 'ws/' + file.replace(/^\.\//, ''),
          time: file.split('-').slice(-1)[0].replace(/\.png$/, '')
        };
      });


      data.screenshots = screenshots;
      res.render('view', data);
    });
  });

});

// External process

// PhantomJS webdriver
var phantomjs = require('phantomjs').path;
var spawn = require('child_process').spawn;

var phantom = spawn(phantomjs, ['--webdriver=9134']);

phantom.stdout.pipe(process.stdout);
phantom.stderr.pipe(process.stderr);
