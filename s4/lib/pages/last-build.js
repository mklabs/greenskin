

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('gs:pages:last-build');

var Job = require('../models/job');
var Build = require('../models/build');

// Kind of model, wraps model for action
module.exports = LastBuildPage;

function LastBuildPage(options) {
  this.options = options || {};
  this.name = this.options.name;

  if (!this.name) return this.error(new Error('Missing name'));

  this.job = new Job({
    name: this.name
  });

  this.fetch();
}

util.inherits(LastBuildPage, EventEmitter);

LastBuildPage.prototype.fetch = function fetch() {
  debug('Fetchig %s name', this.job.name);
  this.job.fetch()
    .on('error', this.error.bind(this))
    .on('sync', this.synced.bind(this));
};

LastBuildPage.prototype.synced = function synced(err) {
  var job = this.job;
  var data = job.toJSON();
  var last = data.lastBuild && data.lastBuild.number;
  var self = this;

  debug('Getting last build %s', last);
  if (!last) return this.emit('end', {
    title: job.name,
    tab: { current: false },
    summary: true,
    job: data
  });


  var build = new Build({
    name: job.name,
    number: last
  });

  build.fetch().on('error', this.emit.bind(this, 'error'));
  build.on('sync', function() {
    self.emit('end', {
      title: job.name,
      tab: { current: true },
      summary: true,
      job: data,
      build: build.toJSON()
    });
  });
};

LastBuildPage.prototype.error = function error(err) {
  err = err || new Error('Page raised an error');
  this.emit('error', err);
};