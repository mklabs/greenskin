var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var debug = require('debug')('gs:phantomas:routes');

var app = require('..');

var xml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/create', function(req, res) {
  var job = new app.gs.Job({
    xml: xml.trim()
  });

  job.script();

  res.render('form', {
    job: job.toJSON()
  });
});

router.get('/:name/edit', function(req, res, next) {
  var job = new app.gs.Job({
    name: req.params.name
  });

  job.fetch().on('error', next);
  job.once('sync', function() {
    res.render('form', {
      job: job.toJSON(),
      tabs: { edit: true },
      title: job.name,
      edit: true
    });
  });
});

// TODO: Dry out post action for edit / create. Really similar.

router.post('/:name/edit', function(req, res, next) {
  var params = req.body;
  var name = params.name;
  var xml = params.xml;
  if (!name) return next(new Error('Missing name'));
  if (!xml) return next(new Error('Missing xml'));

  var job = new app.gs.Job({
    name: name,
    xml: xml
  });

  debug('Edit', params.json);
  job.setCron(params.cron);
  job.setURLs(params.urls);
  job.script(params.script);
  job.jsonConfig(params.json);

  job.save()
    .on('error', next)
    .on('saved', function() {
      var data = job.toJSON();
      res.render('form', {
        saved: true,
        edit: true,
        tabs: { edit: true },
        title: job.name,
        job: data
      });
    });
});

router.post('/create', function(req, res, next) {
  var params = req.body;
  var name = params.name;
  var xml = params.xml;

  if (!name) return next(new Error('Missing name'));
  if (!xml) return next(new Error('Missing xml'));

  var job = new app.gs.Job({
    name: name,
    xml: xml
  });

  if (params.cron) job.setCron(params.cron);
  if (params.urls) job.setURLs(params.urls);
  if (params.script) job.script(params.script);
  if (params.json) job.setJSON(params.json);

  job.save()
    .on('error', next)
    .on('saved', function() {
      res.redirect('/');
    });
});

module.exports = router;