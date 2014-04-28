var debug   = require('debug')('server:app');

var cluster = require('cluster');
var workers = require('os').cpus().length;
var webdriver;

// if (cluster.isMaster) {
//   debug('Cluster worker size', workers);
//   for (var i = 0; i < workers; i++) {
//     debug('Forked cluster', i + 1);
//     cluster.fork();
//   }
//
  webdriver = require('./lib/phantom').webdriver();
//   return;
// }

var fs      = require('fs');
var http    = require('http');
var path    = require('path');
var express = require('express');
var io      = require('socket.io');
var routes  = require('./routes');

// Config
var config = require('./package.json').config;
config.jenkinsUrl = require('url').parse(config.jenkins);
config.jenkinsHost = config.jenkinsUrl.host + config.jenkinsUrl.pathname;

// App
var app = express();
var server = http.createServer(app);
var ws = app.ws = io.listen(server);
ws.set('log level', 1);

// Attach routes helper to app instance for access within subapps
app.routes = require('./routes/helpers');

// Views hack to get subapp works nicely with multiple directories.
//
// Monkey patching express for multiple directories lookup, and hjs for basic layout system.
require('./lib/views')(app);
require('hjs');

// App configuration
app.set('port', process.env.PORT || 3000);

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// App locals
//
// Subapps may edit this to hook into the system, such as adding new buttons to homepage, by doing so in the `mount` event.

// List of create jobs buttons
app.locals.buttons = [];

// Routing

// General
app.get('/', routes.index);

// Maybe generic enough to not be part of a namespace
// Subapp would only need to point the the parent app, eg. /
app.get('/view/:name/run', routes.run);
app.get('/view/:name/build', routes.run);
app.get('/view/:name/last', routes.lastBuild);
app.get('/view/:name/current', routes.lastBuild);
app.get('/delete/:name', routes.destroy);
app.post('/api/create', routes.api.create);
app.post('/api/edit', routes.api.edit);
app.post('/search', routes.search);

// Phantomas jobs
app.use('/p', require('./lib/phantomas'));

// Feature jobs
app.use('/f', require('./lib/feature'));

// Browsertime jobs
app.use('/bt', require('./lib/browsertime'));

// Feature jobs
app.use('/feature', require('./lib/greenskin-feature'));

// Experiment with Queue API
// require('./lib/pool-queue')(app);

server.listen(app.get('port'), function(){
  debug('Express server listening on port %d. Worker id: %s', app.get('port'));
});

