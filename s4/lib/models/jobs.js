
// Job API
//
// INnterface to backend CI like Jenkins

var util = require('util');
var Model = require('./model');
var async = require('async');
var Job = require('./job');

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
    // jobs = me.parse(jobs);

    function done(err, results) {
      if (err) return me.error(err);
      me.emit('render', { jobs: results });
    }

    async.map(jobs, function(data, next) {
      debug('Getting job %s info', data.name);
      var job = new Job(data);

      job.fetch()
        .on('error', next)
        .once('sync', function(jobdata) {
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

