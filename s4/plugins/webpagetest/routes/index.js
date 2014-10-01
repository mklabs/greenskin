var fs      = require('fs');
var path    = require('path');
var express = require('express');
var router  = express.Router();
var debug   = require('debug')('gs:phantomas:routes');
var async   = require('async');
var request = require('request');

var HarPage = require('../lib/harview');
var MetricPage = require('../lib/pages/metrics');

var app = require('..');

var xml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');
var config = require('../../../package.json').config;

xml = xml.replace('{{ wptServer }}', config.wptServer);

router.post('/:name/metrics', function(req, res, next) {
  var assert = req.body.assert;
  var target = req.body.target;
  var job = new app.gs.Job(req.params);

  job.on('error', next);

  job.on('saved', function() {
    res.redirect('/' + job.type + '/' + job.name + '/metrics/*.' + target);
  });

  job.on('sync', function(data) {
    var json = job.get('json');
    var conf = job.get('jsonConfig');

    conf.median = conf.median || {};
    conf.median.firstView = conf.median.firstView || {};
    conf.median.firstView[target] = parseFloat(assert);

    job.jsonConfig(JSON.stringify(conf));
    job.save();
  });

  job.fetch();
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

router.get('/:name', function(req, res, next) {
  var page = new app.gs.LastBuildPage(req.params);

  page.on('error', next);
  page.on('next', next);
  page.on('end', function(data) {
    var number = data.job.lastBuild && data.job.lastBuild.number;
    res.redirect('/webpagetest/' + data.job.name + '/' + (number || 1));
  });
});

router.get('/:name/:number', function(req, res, next) {
  var name = req.params.name;
  var num = req.params.number;
  if (isNaN(num)) return next();

  // Can extend that page, or do specialization here
  var page = new app.gs.BuildPage({
    name: name,
    number: num
  });

  page.on('error', next);
  page.on('end', function(data) {
    debug('Building har view for %s job', data.job.name);

    var workspace = app.gs.config.jenkinsUI + [
      '/job',
      data.job.name,
      'ws/results',
      data.number
    ].join('/').replace(/\/\/+/, '/');

    data.job._urls = data.job.urls.map(function(url) {
      return {
        url: url,
        jenkinsJSON: workspace + '/' + url.replace(/(^https?:\/\/)|(\/$)/g, '').replace(/(\/|\?|-|&|=|\.)/g, '_') + '/build.json'
      };
    });

    async.map(data.job._urls, function(url, done) {
      request(url.jenkinsJSON, function(err, response, body) {
        if (err) return done(err);
        var json = {};

        try {
          json = JSON.parse(body);
        } catch(e) {}

        if (!(json.response && json.response.data && json.response.data.run)) return done(new Error('Failed to load data for build #' + data.number));

        url.summary = json.response.data.summary;
        url.testid = json.response.data.testId;
        url.data = json.response.data;

        url.pages = json.response.data.run.firstView.pages;

        url.screenshot = json.response.data.run.firstView.images.screenShot;
        url.waterfall = url.summary.replace('results.php', 'waterfall.php');
        url.json = JSON.stringify(json, null, 2);

        done(null, url);
      });
    }, function(err, results) {
      if (err) return next(err);
      data.job._urls = results;
      res.render('build', data);
    });
  });
});

router.get('/:name/metrics', function(req, res, next) {
  var name = req.params.name;
  var from = req.query.from;

  var page = new app.gs.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', function(data) {
    var metricPage = new MetricPage(app.gs.config, data);

    var query = req.query.query ? req.query.query : '**';
    metricPage.query(query);

    if (req.query.from) metricPage.from = req.query.from;

    metricPage.build(function(err, page) {
      if (err) return next(err);
      page.query = query;
      res.render('metric', page);
    });
  });
});

router.get('/:name/asserts', function(req, res, next) {
  var name = req.params.name;
  var from = req.query.from;

  var page = new app.gs.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', function(data) {
    data.from = req.query.from;
    var metricPage = new MetricPage(app.gs.config, data);

    var query = req.query.query ? req.query.query : '**';
    metricPage.query(query);

    metricPage.build(function(err, page) {
      if (err) return next(err);
      page.query = query;

      page.metrics = page.metrics.filter(function(metric) {
        return metric.assert;
      });

      res.render('asserts', page);
    });
  });
});

router.get('/:name/metrics/:target', function(req, res, next) {
  var name = req.params.name;
  var from = req.query.from;
  var target = req.params.target;

  var page = new app.gs.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', function(data) {
    var metricPage = new MetricPage(app.gs.config, data);

    if (req.query.from) metricPage.from = req.query.from;
    if (target) metricPage.target = target;

    metricPage.build(function(err, page) {
      if (err) return next(err);
      res.render('metric', page);
    });
  });
});

router.get('/:name/builds', function(req, res, next) {
  var name = req.params.name;

  var page = new app.gs.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', res.render.bind(res, 'builds'));
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
