
var fs = require('fs');
var path = require('path');
var debug = require('debug')('server:routes:api');
var jenkins = require('../lib/jenkins');

var config = require('../package.json').config;
var jobReg = new RegExp('^' + config.job_prefix);

// Phantomjs scripts
var mochaRunner = fs.readFileSync(path.join(__dirname, '../test/mocha-test.js'), 'utf8');
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, '../test/mocha-stepfile.js'), 'utf8');

exports.create = function create(req, res, next){
  var params = req.body;
  debug('API create', params);

  params.urls = params.urls || [];
  params.json_config = params.json_config || params.jsonconfig || params.config || {};

  // Get back XML file from job template param
  fs.readFile(path.join(__dirname, '../data', params.template + '.xml'), 'utf8', function(err, xml) {
    if (err) return next(err);

    var name = params.name;
    name = jobReg.test(name) ? name : config.job_prefix + name;

    xml = replaceUrlsXML(xml, params.urls);
    xml = replaceTimerXML(xml, params.cron);

    var jsonconfig;
    try {
      jsonconfig = JSON.parse(params.json_config);
      params.json_config = JSON.stringify(jsonconfig);
    } catch(e) {
      return next(e);
    }

    if (params.template === 'feature') {
      xml = xml.replace('SCRIPT_BODY', function() {
        return mochaRunner;        
      });

      if (!jsonconfig.steps) {
        jsonconfig.steps = mochaSteps;
        params.json_config = JSON.stringify(jsonconfig);
      }
    }

    xml = replaceJSONConfig(xml, params.json_config);

    debug('Jenkins creating %s job with %s template', name, params.template);
    console.log(mochaRunner);
    console.log(xml);
    jenkins.job.create(name, xml, function(err) {
      if (err) return next(err);
      debug('Jenkins job creation OK');
      res.redirect('/');

    });
  });
};

exports.edit = function edit(req, res, next){
  var params = req.body;
  var name = params.name;
  name = jobReg.test(name) ? name : config.job_prefix + name;

  var urls = params.urls || [];
  debug('API edit', urls);

  var xml = replaceUrlsXML(params.xml, urls);
  xml = replaceTimerXML(xml, params.cron);

  var jsonconfig;
  try {
    jsonconfig = JSON.parse(params.json_config);
    params.json_config = JSON.stringify(jsonconfig);
  } catch(e) {
    return next(e);
  }

  if (params.template === 'feature') {
    if (!jsonconfig.steps) {
      jsonconfig.steps = mochaSteps;
      params.json_config = JSON.stringify(jsonconfig);
    }
  }

  xml = replaceJSONConfig(xml, params.json_config);

  debug('Jenkins updating %s job with', name, urls);

  jenkins.job.config(params.name, xml, function(err) {
    if (err) return next(err);
    debug('Jenkins job edition OK');
    res.redirect('/');
  });
};


// Helpers


// Replaces urls predefined value in Jenkins job custom parameters, using XML job file.
//
// Returns transformed xml
function replaceUrlsXML(xml, urls) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<name>PERF_URLS<\/name>/.test(line)) return;
    ln = i + 2;
  });

  lines[ln] = lines[ln]
    .replace(/<defaultValue>.+<\/defaultValue>/, '<defaultValue>' + urls.join(' ') + '</defaultValue>')
    .replace(/^\s*<defaultValue\/>/, '<defaultValue>' + urls.join(' ') + '</defaultValue>');

  xml = lines.join('\n');

  return xml;
}

function replaceTimerXML(xml, cron) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<hudson.triggers.TimerTrigger>/.test(line)) return;
    ln = i + 1;
  });

  lines[ln] = lines[ln].replace(/<spec>.+<\/spec>/, '<spec>' + cron.trim() + '</spec>');
  xml = lines.join('\n');

  return xml;
}

function replaceJSONConfig(xml, json) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<name>JSON_CONFIG<\/name>/.test(line)) return;
    ln = i + 2;
  });

  lines[ln] = lines[ln].replace(/<defaultValue>.+<\/defaultValue>/, '<defaultValue>' + json + '</defaultValue>');
  xml = lines.join('\n');

  return xml;
}
