var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var debug = require('debug')('gs:phantomas:routes');

var request = require('request');
var HarPage = require('../lib/harview');

var xml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');

var app = require('..');

// Build page - Untill more customized version is rebuilt here
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
      console.log('err?', err);
      if (err) return next(err);
      res.render('build', page);
    });

  });
});

// Local proxy to XHR the build hars (or setup cors for Jenkins &
// reverse proxy)
router.get('/har/:name/:number/:url.json', function(req, res, next) {
  var name = req.params.name;
  var number = req.params.number;
  var url = req.params.url;

  var harfile = app.gs.config.jenkinsUI + [
    'job',
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

var gm = require('gm');

router.get(/^\/thumbnail\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/, function(req, res, next) {
  var name = req.params[0];
  var number = req.params[1]
  var url = req.params[2];
  var file = req.params[3];
  var filename = path.basename(file);

  var screenshot = app.gs.config.jenkinsUI + [
    'job',
    name,
    'ws/results',
    number,
    url,
    file
  ].join('/').replace(/\/\/+/, '/');

  debug('Screenshot request', screenshot, filename);
  var stream = req.pipe(request(screenshot));

  // Resize and pipe the response back
  gm(stream, filename)
    .resize(200, 120)
    .stream()
    .pipe(res);
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
