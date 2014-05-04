var express = require('express');
var router = module.exports = express.Router();
var debug = require('debug')('gs:route');
var async = require('async');

var Jobs = require('..').Jobs;
var Job = require('..').Job;
var Build = require('..').Build;

router.get('/', function(req, res, next) {
  var jobs = new Jobs();

  jobs.fetch()
    .on('error', next)
    .on('render', res.render.bind(res, 'index'));
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

  job.run()
    .on('error', next)
    .on('run', function() {
      var data = job.toJSON();
      debug('dt', data);
      res.redirect('/view/' + job.name);
    });
});

router.get('/view/:name', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  var pending = typeof req.query.pending !== 'undefined';

  job.fetch().on('error', next);

  job.on('sync', function() {
    var data = job.toJSON();
    var last = data.lastBuild && data.lastBuild.number;

    var build = new Build({
      name: job.name,
      number: last
    });

    build.fetch().on('error', next);
    build.on('sync', function() {
      res.render('view', {
        title: job.name,
        tab: { current: true },
        summary: true,
        job: data,
        build: build.toJSON()
      });
    });
  });
});

router.get('/view/:name/:number', function(req, res, next) {
  var num = parseInt(req.params.number, 10);
  var name = req.params.name;
  if (isNaN(num)) return next();

  var build = new Build({
    name: name,
    number: num
  });

  build.fetch().on('error', next);
  build.on('sync', function() {
    var data = build.get('job');

    // Ensure URLs props populated (TODO: Shouldn't be there, have to review
    // Job / Build interractions, initing a job should be enough)
    var xml = build.get('xml');
    data.xml = xml;
    var job = new Job(data);

    res.render('view', {
      title: name,
      number: num,
      summary: true,
      job: job.toJSON(),
      build: build.toJSON()
    });
  });
});

router.get('/view/:name/builds', function(req, res, next) {
  var job = new Job({
    name: req.params.name
  });

  job.fetch().on('error', next);

  job.on('sync', function() {
    debug('Data builds', job.get('builds'));
    async.map(job.get('builds'), function(data, done) {
      var build = new Build({
        name: job.name,
        number: data.number
      });

      build.fetch().on('error', next);
      build.on('sync', function() {
        var data = build.toJSON();
        done(null, data);
      });
    }, function(err, builds) {
      if (err) return next(err);
      res.render('builds', {
        builds: builds,
        title: job.name,
        tab: { builds: true },
        job: job.toJSON()
      });
    });
  });
});
