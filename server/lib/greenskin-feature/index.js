
var fs        = require('fs');
var path      = require('path');
var express   = require('express');
var debug     = require('debug')('greenskin:feature');

var directory = require('serve-index');
var helpers   = require('./helpers');

// Xml template
var xml = fs.readFileSync(path.join(__dirname, 'config.xml'), 'utf8');

// Express subapp
var app = module.exports = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Used for running job locally
var tmpdir = path.join(__dirname, 'tmp');

var gs = app.parent;

// Trigger here any initialization logic
app.on('mount', function(parent) {
  debug('Feature subapp mounted');
  var gs = parent;

  // Attach websocket instance for access later on in routes
  app.ws = parent.ws;

  // Adding buttons
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (Feature)',
    url: '/feature/create'
  });

  // TODO: router = new gs.Router instead ? To store type / namespace once.
  app.get('/edit/:name', gs.routes.edit({
    xml: xml,
    ns: 'feature'
  }));

  app.get('/create', gs.routes.create({
    xml: xml,
    ns: 'feature'
  }));

  app.post('/api/edit', gs.routes.apiEdit({
    ns: 'feature'
  }));

  app.post('/api/create', gs.routes.apiCreate({
    ns: 'feature',
    xml: xml
  }));

  app.get('/edit/:name/steps.js', gs.routes.serveStepfile);

  app.get('/create/steps.js', function(req, res, next) {
    fs.createReadStream(path.join(__dirname, 'stepfile.js')).pipe(res);
  });
});

// For browsing temporary workspaces when running features
app.use('/tmp', express.static(tmpdir));
app.use('/tmp', directory(tmpdir));

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
    title: 'Webdriver feature running',
    runtmpdir: runtmpdir,
    timestamp: timestamp,
    data: data
  };

  debug('Creating job %s %d', jobdata.title, jobdata.timestamp);
  return helpers.runFeature(app.ws, jobdata, function(err, data) {
    if (err) return next(err);
    res.json(data);
  });
});


// app.get('/edit/:name', greenskin.routes.edit);
// app.get('/view/:name', routes.view);
// app.get('/view/:name/:number', routes.buildView);
