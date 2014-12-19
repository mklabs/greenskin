
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require('async');

var Job = require('../models/job');
var Build = require('../models/build');

var debug   = require('debug')('gs:pages:builds');


// Kind of model, wraps model for action
module.exports = BuildsPage;

function BuildsPage(options) {
  this.options = options || {};
  this.name = this.options.name;

  if (!this.name) return this.error(new Error('Missing name'));

  this.job = new Job({
    name: this.name
  });

  this.fetch();
}

util.inherits(BuildsPage, EventEmitter);

BuildsPage.prototype.fetch = function fetch() {
  debug('Build page fetch');
  this.job.fetch()
    .on('error', this.error.bind(this))
    .on('sync', this.synced.bind(this));
};

BuildsPage.prototype.synced = function synced(err) {
  debug('Build page synced');
  var self = this;
  var job = this.job;
  async.map(this.job.get('builds'), function(data, done) {
    var build = new Build({
      name: job.name,
      number: data.number
    });

    build.fetch().on('error', self.emit.bind(self, 'error'));
    build.on('sync', function() {
      var data = build.toJSON();
      done(null, data);
    });
  }, function(err, builds) {
    if (err) return self.emit('error', err);
    self.emit('end', {
      builds: builds,
      title: job.name,
      tab: { builds: true },
      job: job.toJSON()
    });
  });
};

BuildsPage.prototype.error = function error(err) {
  err = err || new Error('Page raised an error');
  this.emit('error', err);
};
