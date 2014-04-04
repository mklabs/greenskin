
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


  debug('Jenkins updating %s job with', name, params);
  jenkins.job.config(params.name, params.xml, function(err) {
    if (err) return next(err);
    debug('Jenkins job edition OK');
    res.redirect('/');
  });
};
