

var config = require('../package.json').config;
var client = require('jenkins')(config.jenkins);

var jenkins = module.exports = client;

var jobReg = new RegExp('^' + config.job_prefix);

// Get all jobs list
jenkins.all = function all(done) {
  return client.job.list(function(err, data) {
    if (err) return done(err);
    var jobs = data.filter(function(job) {
      return jobReg.test(job.name);
    });

    return done(null, jobs);
  });
};


