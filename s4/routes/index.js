var express = require('express');
var router = module.exports = express.Router();
var debug = require('debug')('gs:route');
var async = require('async');

var Jobs = require('../lib/models/jobs');
var Job = require('../lib/models/job');
var Build = require('../lib/models/build');

var BuildPage = require('../lib/pages/build');
var BuildsPage = require('../lib/pages/builds');
var LastBuildPage = require('../lib/pages/last-build');


router.get('/', function(req, res, next) {
  var jobs = new Jobs();

  jobs.fetch()
    .on('error', next)
    .on('render', function(data) {
      res.render('index', data);
    });
});

router.get('/delete/:name', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  job.destroy()
    .on('error', next)
    .on('destroyed', function() {
      res.redirect('/');
    });
});

router.get('/view/:name/run', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  job.on('error', next)
  job.fetch().on('sync', job.run.bind(job));
  job.on('run', function() {
    var data = job.toJSON();
    var ns = job.namespace() || 'view';
    res.redirect('/'+ ns +'/' + job.name + '/builds');
  });
});

// Namespace redirections route. Ask jenkins for full XML, parse
// it to determine the type, then redirect to proper namespace.
router.get('/ns/:name', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  job.on('error', next)
  job.fetch().on('sync', function() {
    res.redirect('/' + job.type + '/' + job.name);
  });
});

router.get('/ns/:name/:number', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  job.on('error', next)
  job.fetch().on('sync', function() {
    res.redirect('/' + job.type + '/' + job.name + '/' + req.params.number);
  });
});

router.get('/view/:name', function(req, res, next) {
  var page = new LastBuildPage(req.params);

  page.on('error', next);
  page.on('end', function(data) {
    res.render('view', data);
  });
});

router.get('/view/:name/:number', function(req, res, next) {
  var num = parseInt(req.params.number, 10);
  var name = req.params.name;
  if (isNaN(num)) return next();

  var page = new BuildPage({
    name: name,
    number: num
  });

  page.on('error', next);
  page.on('end', res.render.bind(res, 'view'));
});

router.get('/view/:name/builds', function(req, res, next) {
  var name = req.params.name;

  var page = new BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', res.render.bind(res, 'builds'));
});
