
var debug = require('debug')('server:index');
var jenkins = require('../lib/jenkins');
var xml2js = require('xml2js');


var Job = require('../lib/job');

var phantomas = require('phantomas');
var metadata = phantomas.metadata;
var metrics = Object.keys(metadata.metrics).sort().map(function(key) {
  var metric = metadata.metrics[key];
  metric.name = key;
  return metric;
});

var config = require('../package.json').config;

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
  var job = new Job('', next);

  job.on('end', function(data) {
    data.title = 'Create job';
    data.action = '/api/create';
    res.render('create', data);
  });
};

/*
 * GET edit job page
 */

exports.edit = function edit(req, res, next){
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = 'Edit job';
    data.action = '/api/edit';
    data.edit = true;
    res.render('create', data);
  });
};

exports.view = function view(req, res, next){
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = 'View job';
    data.edit = false;
    console.log(data.job);
    res.render('view', data);
  });
};

exports.buildView = function buildView(req, res, next){
  var name = req.params.name;
  var number = req.params.number;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = 'View job';
    data.edit = false;
    data.number = number;
    console.log(data.job);

    data.config = config;
    data.job._urls = data.job.urls.map(cleanUrl);
    res.render('build', data);
  });
};


// Helper to cleanup URL for filesystem I/O or graphite keys
function cleanUrl(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/g, '')
    .replace(/(\/|\?|-|&amp;|=|\.)/g, '_');
}

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
