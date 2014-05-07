var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var debug = require('debug')('gs:phantomas:routes');

var async = require('async');
var request = require('request');

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
  // page.on('end', res.render.bind(res, 'build'));

  // TODO: Abstract away zip retrieval from Jenkins, readding coupling
  page.on('end', function(data) {
    var workspace = app.gs.config.jenkinsUI + [
      'job',
      data.job.name,
      'ws/results'
    ].join('/').replace(/\/\/+/, '/');


    if (data.build.color !== 'blue') return res.render('build', data);

    var results = {};

    var fileindex = workspace + '/' + num + '/files.txt';

    debug('Request zip file', fileindex);
    request(fileindex, function(err, response, body) {
      if (err) return next(err);

      var files = body.split(/\r?\n/);
      debug('Files', files);

      files.forEach(function(filename) {
        filename = filename.replace(/^\.\//, '');
        if (!filename) return;
        var parts = filename.match(/^([^\/]+)\/(.+)/) || [];
        var url = parts[1] || '';
        var file = parts[2] || '';
        if (!(url && file)) {
          debug('File: Cannot extract URL & file from entry: ', filename);
          return;
        }

        var data = results[url] = results[url] || {};

        debug('File:', url, file);
        if (file === 'build.json') {
          data.build = file;
        } else if (file === 'har.json') {
          data.har = file;
        } else if (/^filmstrip/.test(file)) {
          data.screenshots = (data.screenshots || []);
          data.screenshots.push(file);
        } else if (file === 'screenshot.png') {
          data.screenshot = file;
        }
      });

      debug('Done filing', Object.keys(results));

      var urls = Object.keys(results).map(function(key) {
        var url = encodeURI(key);
        var urlData = {
          id: url,
          url: url,
          jenkinsHar: [workspace, data.number, url, 'har.json'].join('/'),
          localHar: '/phantomas/har/' + data.job.name + '/' + data.number + '/' + url + '.json',
          jenkinsFilmstripDir: [workspace, data.number, url, 'filmstrip'].join('/')
        };

        function extractTime(obj) {
          var value = obj.split('-').slice(-1)[0].replace('.png', '');
          return parseInt(value, 10);
        }

        urlData.screenshots = results[key].screenshots.map(function(entry) {
          return {
            url: workspace + '/' + data.number + '/' + url + '/' + entry,
            time: extractTime(entry)
          };
        }).sort(function(a, b) {
          debug('Sort time', typeof a.time, typeof b.time);
          if (a.time === b.time) return 0;
          return a.time < b.time ? -1 : 1;
        });

        return urlData;
      });

      data.job._urls = urls;
      res.render('build', data);
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
