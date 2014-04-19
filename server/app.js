
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var feature = require('./routes/feature');

var debug = require('debug')('server:app');

var fs = require('fs');
var http = require('http');
var path = require('path');
var request = require('request');
var kue = require('kue');

var io = require('socket.io');

var config = require('./package.json').config;
config.jenkinsUrl = require('url').parse(config.jenkins);
config.jenkinsHost = config.jenkinsUrl.host + config.jenkinsUrl.pathname;

var app = express();

// Check redis connection, we can live without
var redis = require('redis');
kue.redis.createClient = function() {
  var client = redis.createClient();
  client.on('error', function(err) {
    app.kue = false;
    debug('Redis connection error', err);
    debug('Will fallback to direct invocation. Consider checking it\'s running, or installed (Default port)');
  });

  return client;
};

app.use('/kue', express.basicAuth('kue', 'kue'));
app.use('/kue', kue.app);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// Lame layout system hack
var hjs = require('hjs');
var __express = hjs.__express;
hjs.__express = function(name, options, fn) {
	var layout = options._layout || 'layout';
	__express(name, options, function(err, body) {
		if (err) return fn(err);
		fs.readFile(path.join(__dirname, 'views', layout + '.hjs'), 'utf8', function(err, layout) {
			if (err) return fn(err);
			var tpl = hjs.compile(layout);
			options.yield = body;
			return fn(null, tpl.render(options));
		});
	});
};

app.set('view engine', 'hjs');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.directory(__dirname));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

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

// Proxy /jenkins prefix to jenkins instance
if (config.proxy) app.all(/\/(jenkins|static)\/?.*/, function(req, res, next) {
	var pathname = req.url.replace(/^\/jenkins\/?/, '');
	var url = config.jenkins + pathname;
	req.pipe(request(url)).pipe(res);
});

var server = http.createServer(app);
var ws = app.ws = io.listen(server);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Experiment with Gherkin editing
require('./routes/feature')(app);
