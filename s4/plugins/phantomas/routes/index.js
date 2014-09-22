var fs      = require('fs');
var path    = require('path');
var express = require('express');
var router  = express.Router();
var debug   = require('debug')('gs:phantomas:routes');
var gm      = require('gm');
var which   = require('which');

var request = require('request');
var HarPage = require('../lib/harview');
var MetricPage = require('../lib/pages/metrics');

var xml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');

var app = require('..');

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
    console.log(conf, conf[target]);
    conf.asserts = conf.asserts || {};
    conf.asserts[target] = parseFloat(assert);

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
    data.job.tabs = [{
      url: '/phantomas/' + req.params.name + '/metrics',
      text: 'Metrics'
    }, {
      url: '/phantomas/' + req.params.name + '/asserts',
      text: 'Asserts'
    }];

    res.render('view', data);
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

    var harPage = new HarPage(app.gs.config, data);
    harPage.build(function(err, page) {
      if (err) return next(err);
      res.render('build', page);
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
    data.from = req.query.from;
    var metricPage = new MetricPage(app.gs.config, data);

    var query = req.query.query ? req.query.query : '**';
    metricPage.query(query);

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
  var query = req.params.target || '**';
  var from = req.query.from;

  var page = new app.gs.BuildsPage({
    name: name
  });

  page.on('error', next);
  page.on('end', function(data) {
    data.from = from;
    var metricPage = new MetricPage(app.gs.config, data);
    metricPage.query(query);
    metricPage.build(function(err, page) {
      if (err) return next(err);
      page.query = query;
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

// Local proxy to XHR the build hars (or setup cors for Jenkins &
// reverse proxy)
router.get('/har/:name/:number/:url.json', function(req, res, next) {
  var name = req.params.name;
  var number = req.params.number;
  var url = req.params.url;

  var harfile = app.gs.config.jenkinsUI + [
    '/job',
    name,
    'ws/results',
    number,
    encodeURI(url),
    'har.json'
  ].join('/').replace(/\/\/+/, '/');

  debug('HAR request', name, number, url);
  debug('HAR file', harfile);
  req.pipe(request(harfile)).pipe(res);
});

router.get(/^\/thumbnail\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/, function(req, res, next) {
  var name = req.params[0];
  var number = req.params[1]
  var url = req.params[2];
  var file = req.params[3];
  var filename = path.basename(file);

  var screenshot = app.gs.config.jenkinsUI + [
    '/job',
    name,
    'ws/results',
    number,
    url,
    file
  ].join('/').replace(/\/\/+/, '/');

  debug('Screenshot request', screenshot, filename);

  // Failsafe check on both imagemagick and graphicsmagick to not throw
  // errors with gm when resizing
  which('imagemagick', function(err) {
    if (err) {
      console.error('imagemagick is not available on this platform, can\'t resize to thumbnail. Please install it to get rid of this log (and restart the server)');
      return request(screenshot).pipe(res);
    }

    which('graphicsmagick', function(err) {
      if (err) {
        console.error('graphicsmagick is not available on this platform, can\'t resize to thumbnail. Please install it to get rid of this log (and restart the server)');
        return request(screenshot).pipe(res);
      }

    });

    // Resize and pipe the response back
    var stream = req.pipe(request(screenshot));
    gm(stream, filename)
      .resize(200, 120)
      .stream()
      .pipe(res);
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
