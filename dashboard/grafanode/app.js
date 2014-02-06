
/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var url = require('url');
var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'grafana')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Home
// app.get('/', function(req, res, next) {
//   next('Thing');
// });

// JSONss
//
// TODO: Transform jsons dynamically
app.get(/\.json$/, function(req, res, next) {
  var pathname = url.parse(req.url).pathname.replace(/^\//, '');
  var ref = req.get('Referer');
  console.log('Serve file', pathname);
  console.log('Ref', ref);

  fs.createReadStream(path.join('grafana', pathname))
    .on('error', next)
    .pipe(res);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
