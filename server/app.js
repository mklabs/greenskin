
var fs      = require('fs');
var debug   = require('debug')('server:app');
var http    = require('http');
var path    = require('path');
var cluster = require('cluster');
var express = require('express');
var kue     = require('kue');
var redis   = require('redis');
var io      = require('socket.io');
var routes  = require('./routes');
var feature = require('./routes/feature');

// Config
var config = require('./package.json').config;
config.jenkinsUrl = require('url').parse(config.jenkins);
config.jenkinsHost = config.jenkinsUrl.host + config.jenkinsUrl.pathname;

// App
var app = express();
var server = http.createServer(app);
var ws = app.ws = io.listen(server);

ws.set('log level', 1);

// App configuration
app.set('port', process.env.PORT || 3000);

// Monkey patch hjs to impl. a basic layout system
require('./lib/hjs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// Check redis connection, we can live without. Use to indicate if the app have been able to connect to redis, otherwise will fallback to direct invocation.
app.kue = true;

// Middlewares
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// App locals
//
// Subapps may edit this to hook into the system, such as adding new buttons to homepage, by doing so in the `mount` event.

// List of create jobs buttons
app.locals.buttons = [{
  name: 'Create Job (simple metrics)',
  url: '/p/create'
}, {
  name: 'Create Job (Functional)',
  url: '/f/create'
}];

// Routing

// Experiment: Routes - composable plugins

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
// app.use('/p', phantomas());
app.get('/p/create', routes.create);
app.get('/p/edit/:name', routes.edit);
app.get('/p/view/:name', routes.view);
app.get('/p/har/:name/:number/:url.json', routes.har);
app.get('/p/view/:name/asserts', routes.metrics);
app.get('/p/view/:name/metrics', routes.metrics);
app.get('/p/view/:name/asserts/:metric', routes.metric);
app.get('/p/view/:name/metrics/:metric', routes.metric);
app.post('/p/view/:name/asserts/:metric', routes.api.metric);
app.post('/p/view/:name/metrics/:metric', routes.api.metric);
app.post('/p/view/:name/asserts/:metric/del', routes.api.metricDelete);
app.post('/p/view/:name/metrics/:metric/del', routes.api.metricDelete);
// Must come after asserts, or will route will clash
app.get('/p/view/:name/:number', routes.buildView);

// Feature jobs
app.get('/f/edit/:name', routes.edit);
app.get('/f/view/:name', routes.view);
app.get('/f/view/:name/:number', routes.buildView);
app.get('/f/edit/:name/steps.js', routes.serveStepfile);
app.get('/f/create/steps.js', function(req, res, next) {
  fs.createReadStream(path.join(__dirname, 'test/mocha-stepfile.js')).pipe(res);
});

// Experiment with Gherkin editing
require('./routes/feature')(app);

// Experiment with Queue API
// require('./lib/pool-queue')(app);


if (!cluster.isMaster) return;

var clusterWorkerSize = require('os').cpus().length;
debug('Cluster worker size', clusterWorkerSize);

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

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

for (var i = 0; i < clusterWorkerSize; i++) {
  debug('Forked cluster', i + 1);
  cluster.fork();
}
