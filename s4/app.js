var fs         = require('fs');
var path       = require('path');
var express    = require('express');
var logger     = require('morgan');
var bodyParser = require('body-parser');
var directory  = require('serve-index');
var hbs        = require('./lib/express/hbs');
var debug      = require('debug')('gs');
var config     = require('./package').config;

var StatsD = require('../../statsd-fs');

var app = module.exports = express();

// Main config options
app.config = config;

// Attach ref to hbs for subapps to register their own partials / blocks
app.hbs = hbs;

// And StatsD
app.StatsD = StatsD;

// Models
app.Job   = require('./lib/models/job');
app.Jobs  = require('./lib/models/jobs');
app.Model = require('./lib/models/model');
app.Build = require('./lib/models/build');

// Pages
app.BuildPage = require('./lib/pages/build');
app.BuildsPage = require('./lib/pages/builds');
app.LastBuildPage = require('./lib/pages/last-build');

// Application locals (Made available to every template)
app.locals.buttons = [];
app.locals.config = config;

// For subapps to pass around the layout filepath
app.layout = path.join(__dirname, 'views/layout.hbs');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', directory(path.join(__dirname, 'public')));
app.use('/tmp', express.static(path.join(__dirname, 'tmp')));
app.use('/tmp', directory(path.join(__dirname, 'tmp')));

app.use(logger('dev'));

// GS routes
app.use('/', require('./routes'));

app.use('/statsd', StatsD.app.middleware({
  base: './tmp/metrics'
}));

// Subapps
fs.readdirSync(path.join(__dirname, 'plugins')).forEach(function(dir) {
  if (fs.statSync(path.join(__dirname, 'plugins', dir)).isFile()) return;

  debug('Register %s on /%s', dir, dir);
  try {
    app.use('/' + dir, requireApp('./plugins/' + dir));
  } catch(e) {
    console.error('Cant load %s app', dir, e.message);
  }
});

function requireApp(dir, options) {
  options = options || {};
  var name = options.name || path.basename(dir);
  var subapp = require(dir);

  subapp.locals.baseURL = '/' + name;

  // TODO: Requires a patch in hbs. See if we can workaround that by monkey patching.
  subapp.locals.layout = app.layout;
  subapp.locals.classname = 'gs-' + name;
  subapp.set('view engine', app.get('view engine'));
  return subapp;
}


// External forked process
app.on('listen', function() {
  debug('Listening');
  var statsd = new StatsD({
    path: require.resolve('statsd/stats'),
    config: path.join(__dirname, 'statsd-config.js')
  });

  statsd.on('exit', debug.bind('StatsD exit'));
  statsd.on('error', debug.bind('StatsD error'));
  statsd.on('close', debug.bind('StatsD close'));

  statsd.run();

  debug('StatsD listening. Args: ', statsd.args);
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace

var dev = app.get('env') === 'development';

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: dev ? err : {}
  });
});
