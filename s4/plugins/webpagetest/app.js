var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('gs:webpagetest');

var app = module.exports = express();

var routes = require('./routes/index');

app.on('mount', function(gs) {
  debug('App mounted, setting gs instance');
  app.gs = gs;
  // Attach here any initialization logic
  gs.locals.buttons.push({
    name: 'Create Webpagetest Job (chrome)',
    url: '/webpagetest/create'
  });

  debug('Initing partial dir');
  gs.hbs.registerPartials(path.join(__dirname, 'views/partials'));

  gs.Job.type('webpagetest', function(xml) {
    return /webpagetest/.test(xml);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

module.exports = app;
