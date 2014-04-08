
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');

var fs = require('fs');
var http = require('http');
var path = require('path');
var request = require('request');

var config = require('./package.json').config;

var app = express();

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
app.use(express.favicon());
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

// Map over /static, jenkins uses this URL for static assets
//app.all('');

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
