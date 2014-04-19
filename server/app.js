
var debug   = require('debug')('server:app');
var http    = require('http');
var path    = require('path');
var cluster = require('cluster');
var express = require('express');
var kue     = require('kue');
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

// Middlewares
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Feature edit subapp
// app.use('/feature', require('./lib/feature-edit'));

// Routes
app.get('/', routes.index);
app.get('/create', routes.create);
app.get('/view/:name', routes.view);
app.get('/edit/:name', routes.edit);

app.get('/view/:name/asserts', routes.metrics);
app.get('/view/:name/metrics', routes.metrics);

app.get('/view/:name/asserts/:metric', routes.metric);
app.get('/view/:name/metrics/:metric', routes.metric);
app.post('/view/:name/asserts/:metric', routes.api.metric);
app.post('/view/:name/metrics/:metric', routes.api.metric);

app.post('/view/:name/asserts/:metric/del', routes.api.metricDelete);
app.post('/view/:name/metrics/:metric/del', routes.api.metricDelete);

app.get('/view/:name/run', routes.run);
app.get('/view/:name/build', routes.run);

app.get('/view/:name/last', routes.lastBuild);
app.get('/view/:name/current', routes.lastBuild);

app.get('/view/:name/:number', routes.buildView);
app.get('/har/:name/:number/:url.json', routes.har);

app.get('/delete/:name', routes.destroy);
app.post('/api/create', routes.api.create);
app.post('/api/edit', routes.api.edit);

if (!cluster.isMaster) return;

var clusterWorkerSize = require('os').cpus().length;
debug('Cluster worker size', clusterWorkerSize);

// Check redis connection, we can live without
var redis = require('redis');
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

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Experiment with Gherkin editing
require('./routes/feature')(app);

for (var i = 0; i < clusterWorkerSize; i++) {
  debug('Forked cluster', i + 1);
  cluster.fork();
}
