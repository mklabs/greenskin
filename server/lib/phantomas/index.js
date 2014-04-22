var express = require('express');
var debug   = require('debug')('server:phantomas');

// Untill routes for phantomas jobs are ported over here, and better
// isolated from the rest of the app
var routes  = require('../../routes');

var app = module.exports = express();

// Trigger here any initialization logic
app.on('mount', function(parent) {
  debug('Phantomas subapp mounted');
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (simple metrics)',
    url: '/p/create'
  });
});

app.get('/create', routes.create);
app.get('/edit/:name', routes.edit);
app.get('/view/:name', routes.view);
app.get('/har/:name/:number/:url.json', routes.har);
app.get('/view/:name/asserts', routes.metrics);
app.get('/view/:name/metrics', routes.metrics);
app.get('/view/:name/asserts/:metric', routes.metric);
app.get('/view/:name/metrics/:metric', routes.metric);
app.post('/view/:name/asserts/:metric', routes.api.metric);
app.post('/view/:name/metrics/:metric', routes.api.metric);
app.post('/view/:name/asserts/:metric/del', routes.api.metricDelete);
app.post('/view/:name/metrics/:metric/del', routes.api.metricDelete);
// Must come after asserts, or will route will clash
app.get('/view/:name/:number', routes.buildView);
