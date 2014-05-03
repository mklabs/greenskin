var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var debug = require('debug')('gs:phantomas:routes');

var app = require('..');

var xml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/create', function(req, res) {
  var job = new app.gs.Job({
    xml: xml.trim()
  });

  debug('Create:', job.keys());
  res.render('form', {
    job: job.toJSON()
  });
});

router.post('/create', function(req, res, next) {
  var params = req.body;

  params.urls = params.urls || [];
  params.json_config = params.json_config || params.jsonconfig || params.config || '{}';
  debug('Create Job', params);

  var name = params.name;
  var xml = params.xml;

  if (!name) return next(new Error('Missing name'));
  if (!xml) return next(new Error('Missing xml'));

  // xml = replaceUrlsXML(xml, params.urls);
  // xml = replaceTimerXML(xml, params.cron);

  // var jsonconfig;
  // try {
  //   jsonconfig = JSON.parse(params.json_config);
  //   params.json_config = JSON.stringify(jsonconfig);
  // } catch(e) {
  //   return next(e);
  // }

  // if (params.template === 'feature') {
  //   xml = xml.replace('SCRIPT_BODY', function() {
  //     return mochaRunner;
  //   });

  //   if (!jsonconfig.steps) {
  //     jsonconfig.steps = mochaSteps;
  //     params.json_config = JSON.stringify(jsonconfig);
  //   }
  // }

  // xml = replaceJSONConfig(xml, params.json_config);

  debug('Jenkins creating %s job with %s template', name);
  var job = new app.gs.Job({
    name: name,
    xml: xml
  });

  job.save()
    .on('error', next)
    .on('saved', function() {
      debug('Jenkins job creation OK');
      res.redirect('/');
    });
});

module.exports = router;
