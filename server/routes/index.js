
var debug = require('debug')('server:index');
var jenkins = require('../lib/jenkins');
var xml2js = require('xml2js');

exports.api = require('./api');

/*
 * GET home page.
 */

exports.index = function(req, res, next){
  debug('Index', req.url);
  jenkins.all(function(err, jobs) {
    if (err) return next(err);
    debug('Render all', jobs);
    res.render('index', { title: 'Express', jobs: jobs });
  });
};


/*
 * GET create job page
 */

exports.create = function(req, res, next){
  res.render('create', {
    title: 'Create job',
    action: '/api/create',
    cron: '*/15 * * * *'
  });
};

/*
 * GET edit job page
 */

exports.edit = function edit(req, res, next){
  var name = req.params.name;
  jenkins.job.get(name, function(err, job) {
    if (err) return next(err);
    jenkins.job.config(name, function(err, config) {
      if (err) return next(err);
      job.xml = config;

      xml2js.parseString(config, function(err, result) {
        if (err) return next(err);

        // Figure out the URLs in XML file
        var params = ((result.project.properties || [])[0] || {})['hudson.model.ParametersDefinitionProperty'];

        params = params &&
          params[0] &&
          params[0].parameterDefinitions &&
          params[0].parameterDefinitions[0] &&
          params[0].parameterDefinitions[0]['hudson.model.StringParameterDefinition'];

        var urls = [];
        if (params) {
          urls = params.filter(function(param) {
            return param.name[0] === 'PERF_URLS';
          }).map(function(param) {
            return param.defaultValue[0].split(' ');
          })[0];
        }

        // As well as the cron frequency
        var timer = result.project.triggers.filter(function(trigger) {
          return trigger['hudson.triggers.TimerTrigger'];
        })[0];

        var cron = '';
        if (timer) {
          cron = timer['hudson.triggers.TimerTrigger'][0]['spec'][0]
          console.log(timer, cron);
        }

        job.urls = urls;
        debug('Render all');
        res.render('create', {
          title: 'Edit job',
          action: '/api/edit',
          edit: true,
          job: job,
          cron: cron
        });
      });
    });
  });
};

/*
 * GET delete job
 */

exports.destroy = function destroy(req, res, next){
  var name = req.params.name;
  jenkins.job.delete(name, function(err) {
    if (err) return next(err);
    debug('Jenkins job deletion OK');
    res.redirect('/');
  });
};
