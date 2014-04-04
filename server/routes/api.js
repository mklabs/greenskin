
var fs = require('fs');
var path = require('path');
var debug = require('debug')('routes:api');
var jenkins = require('../lib/jenkins');

var config = require('../package.json').config;
var jobReg = new RegExp('^' + config.job_prefix);

exports.create = function create(req, res, next){
  var params = req.body;
  debug('API create', params);

  // Get back XML file from job template param
  fs.readFile(path.join(__dirname, '../data', params.template + '.xml'), function(err, xml) {
    if (err) return next(err);
    console.log('XML', xml);

    var name = params.name;
    name = jobReg.test(name) ? name : config.job_prefix + name;

    debug('Jenkins creating %s job with %s template', name, params.template);
    jenkins.job.create(name, xml, function(err) {
      if (err) return next(err);
      debug('Jenkins job creation OK');
      res.redirect('/');

    });
  });
};

exports.edit = function edit(req, res, next){
  var params = req.body;
  debug('API edit', params);

  var name = params.name;
  name = jobReg.test(name) ? name : config.job_prefix + name;

  var urls = params.urls;
  debug('API edit', urls);

  // Update relevant part in XML ... aie
  var xml = params.xml;
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<name>PERF_URLS<\/name>/.test(line)) return;
    ln = i + 2;
  });

  lines[ln] = lines[ln].replace(/<defaultValue>.+<\/defaultValue>/, '<defaultValue>' + urls.join(' ') + '</defaultValue>');
  xml = lines.join('\n');

  debug('Jenkins updating %s job with', name, urls);
  jenkins.job.config(params.name, xml, function(err) {
    if (err) return next(err);
    debug('Jenkins job edition OK');
    res.redirect('/');
  });
};
