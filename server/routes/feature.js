var debug = require('debug')('server:feature');
var jenkins = require('../lib/jenkins');
var xml2js = require('xml2js');
var request = require('request');

var Job = require('../lib/job');


exports.index = function(req, res, next) {
  debug('Index', req.url);
  jenkins.all(function(err, jobs) {
    if (err) return next(err);
    debug('Render all', jobs);
    res.render('index', { jobs: jobs });
  });
};