
var express = require('express');
var fs      = require('fs');
var path    = require('path');
var debug   = require('debug')('gs:browserperf:routes');
var request = require('request');
var read    = fs.readFileSync;

var app = require('./');
var Jobb = require('jobb');

var templates = {};
templates.install = read(path.join(__dirname, 'job/1_install.sh'), 'utf8');
templates.build = read(path.join(__dirname, 'job/2_build.js'), 'utf8');
templates.format = read(path.join(__dirname, 'job/3_format.sh'), 'utf8');
templates.config = require('./job/config.json');
templates.params = require('./job/params.json');

var router = module.exports = express.Router();

function noop(req, res, next) {
  debug('Noop route', req.url);
  var url = req.url;
  res.redirect('/view' + url);
}

router.get('/create', function(req, res) {
  debug('Wrong route ?', req.url);

  var params = templates.params;

  var template = Jobb('Template')
    .description(templates.config.description || 'Browserperf based job')
    .script(templates.install)
    .script(templates.build)
    .script(templates.format)

    .param('PERF_URLS', {
      description: 'List of URLs to test. Space separated.'
    })

    .param('JSON_CONFIG', {
      description: 'Browserperf JSON config',
      value: JSON.stringify({
        foo: 'bar'
      })
    })

    .timer('*/45 * * * *')

  if (Array.isArray(params.params)) params.params.forEach(function(param) {
    template.param(param.name, param);
  });

  var xml = template.xml();

  var job = new app.gs.Job({
    xml: xml
  });

  job.script();
  res.render('form', {
    job: job.toJSON()
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

// router.get('/create', noop);
// router.post('/create', noop);
router.get('/:name', noop);
router.get('/:name/number', noop)
router.get('/:name/builds', noop);
router.get('/:name/edit', noop);
router.post('/:name/edit', noop);

