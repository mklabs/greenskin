var debug   = require('debug')('server:app');

var cluster = require('cluster');
var workers = require('os').cpus().length;
if (cluster.isMaster) {
  debug('Cluster worker size', workers);
  for (var i = 0; i < workers; i++) {
    debug('Forked cluster', i + 1);
    cluster.fork();
  }

  return;
}

var fs      = require('fs');
var http    = require('http');
var path    = require('path');
var express = require('express');
var kue     = require('kue');
var redis   = require('redis');
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

// Views hack to get subapp works nicely with multiple directories.
//
// Monkey patching express for multiple directories lookup, and hjs for basic layout system.
require('./lib/views')(app);

// App configuration
app.set('port', process.env.PORT || 3000);

// Check redis connection, we can live without.
//
// Used to indicate if the app have been able to connect to redis, otherwise will fallback to direct invocation.
app.kue = true;
kue.redis.createClient = function() {
  var client = redis.createClient();
  client.on('error', function(err) {
    app.kue = false;
    debug('Redis connection error', err.stack);
    debug('Will fallback to direct invocation. Consider checking it\'s running, or installed (Default port)');
  });

  return client;
};

app.use('/kue', express.basicAuth('kue', 'kue'));
app.use('/kue', kue.app);

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

// Experiment with Queue API
// require('./lib/pool-queue')(app);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

