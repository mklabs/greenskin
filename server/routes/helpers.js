var Job     = require('../lib/job');
var jenkins = require('../lib/jenkins');
var debug   = require('debug')('server:routes:helpers');
var config  = require('../package.json').config;
var jobReg  = new RegExp('^' + config.job_prefix);

var xmlHelper = require('../lib/helpers');

var routes = require('./index');
var helpers = module.exports;

Object.keys(routes).forEach(function(route) {
  helpers[route] = routes[route];
});

// Set of route helpers, wrapping an express middleware / request handler.
helpers.edit = function edit(options) {
  options = options || {};
  var ns = (options.ns ? options.ns + '/' : '');

  return function(req, res, next) {
    var name = req.params.name;
    var job = new Job(name, next, options);

    job.on('end', function(data) {
      data.title = name;
      data.action = options.action || '/' + ns + 'api/edit';
      data.runUrl = options.runUrl || '/' + ns + 'create/run-feature/';
      data.edit = true;
      res.render(options.template || 'form', data);
    });
  };
};

helpers.create = function create(options) {
  options = options || {};
  var ns = (options.ns ? options.ns + '/' : '');

  return function(req, res, next) {
    var job = new Job('', next, options);

    job.on('end', function(data) {
      data.title = options.title || 'Create job';
      data.action = options.action || '/' + ns + 'api/create';
      data.runUrl = options.runUrl || '/' + ns + 'create/run-feature/';
      data.job.json = JSON.stringify(data.job.config);
      res.render('form', data);
    });
  };
};

helpers.apiCreate = function apiCreate(options) {
  options = options || {};
  var ns = (options.ns ? '/' + options.ns + '/' : '/');
  var xml = options.xml;

  if (!xml) throw new Error('Missing xml template for apiCreate route');

  return function(req, res, next) {
    var params = req.body;
    var name = params.name;
    name = jobReg.test(name) ? name : config.job_prefix + name;

    params.urls = params.urls || [];
    params.json_config = params.json_config || params.jsonconfig || params.config || '{}';
    debug('API create');

    xml = xmlHelper.replaceUrlsXML(xml, params.urls);
    xml = xmlHelper.replaceTimerXML(xml, params.cron);

    var jsonconfig;
    try {
      jsonconfig = JSON.parse(params.json_config);
      params.json_config = JSON.stringify(jsonconfig);
    } catch(e) {
      return next(e);
    }

    xml = xmlHelper.replaceJSONConfig(xml, params.json_config);

    debug('Jenkins creating %s job with template');
    jenkins.job.create(name, xml, function(err) {
      if (err) return next(err);
      debug('Jenkins job creation OK');
      res.redirect('/');
    });
  };
};

helpers.apiEdit = function apiEdit(options) {
  options = options || {};
  var ns = (options.ns ? '/' + options.ns + '/' : '/');

  return function(req, res, next) {
    var params = req.body;
    var name = params.name;
    name = jobReg.test(name) ? name : config.job_prefix + name;

    var urls = params.urls || [];
    debug('API edit', urls);

    var xml = xmlHelper.replaceUrlsXML(params.xml, urls);
    xml = xmlHelper.replaceTimerXML(xml, params.cron);

    var jsonconfig;
    try {
      jsonconfig = JSON.parse(params.json_config);
      params.json_config = JSON.stringify(jsonconfig);
    } catch(e) {
      return next(e);
    }

    xml = xmlHelper.replaceJSONConfig(xml, params.json_config);

    debug('Jenkins updating %s job with', name, urls);
    jenkins.job.config(params.name, xml, function(err) {
      if (err) return next(err);
      debug('Jenkins job edition OK');
      res.redirect(ns + 'edit/' + name);
    });
  };
};
