
var path       = require('path');
var debug      = require('debug')('gs:statsd');
var express    = require('express');
var bodyParser = require('body-parser');
var directory  = require('serve-index');

var app = module.exports = express();

app.middleware = function(options) {
  options = options || {};

  app.set('base', options.base);

  if (options.base) {
    debug('Init directory viewer', options.base);
    app.use(directory(options.base));
    app.use(express.static(options.base));
  }

  return app;
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes'));

module.exports = app;
