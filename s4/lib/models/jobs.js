
// Job API
//
// Interface to backend CI like Jenkins

var util = require('util');
var Model = require('./model');
var async = require('async');
var Job = require('./job');
var config = require('../../package').config;

var debug = require('debug')('gs:jobs');

module.exports = Jobs;

function Jobs() {
  Model.apply(this, arguments);
  debug('Init jobs', this.cid);
}

util.inherits(Jobs, Model);

Jobs.prototype.fetch = function fetch() {
  var me = this;

  this.client.list(function(err, jobs) {
    if (err) return me.error(err);
    me.emit('jobs', jobs);

    function done(err, results) {
      if (err) return me.error(err);

      // Filter out jobs without a proper structure (now, just excluding static list of jobs from conf)
      results = results.filter(function(res) {
        return config.ignoredJobs.indexOf(res.name) === -1;
      });

      me.emit('render', { jobs: results });
    }


    // Bypass the map over every jobs, takes far too long
    return done(null, jobs);

    // To get full info on every jobs
    async.map(jobs, function(data, next) {
      var jobnow = Date.now();
      debug('Getting job %s info', data.name);
      var job = new Job(data);

      job.fetch()
        .once('error', next)
        .once('sync', function(jobdata) {
          debug('Got job info', Date.now() - jobnow, Date.now() - now);
          next(null, job.toJSON());
        });
    }, done);

  });

  return this;
};

Jobs.prototype.parse = function parse(jobs) {
  return jobs.map(function(data) {
    var job = new Job(data);
    return job.toJSON();
  });
};

