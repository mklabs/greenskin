
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Job = require('../models/job');
var Build = require('../models/build');

// Kind of model, wraps model for action
module.exports = BuildPage;

function BuildPage(options) {
  this.options = options || {};
  this.name = this.options.name;
  this.number = this.options.number;

  if (!this.name) return this.error(new Error('Missing name'));
  if (!this.number) return this.error(new Error('Missing number'));

  this.build = new Build({
    name: this.name,
    number: this.number
  });

  this.fetch();
}

util.inherits(BuildPage, EventEmitter);

BuildPage.prototype.fetch = function fetch() {
  this.build.fetch()
    .on('error', this.error.bind(this))
    .on('sync', this.synced.bind(this));
};

BuildPage.prototype.synced = function synced(err) {
  var build = this.build;
  var data = build.get('job');

  // Ensure URLs props populated (TODO: Shouldn't be there, have to review
  // Job / Build interractions, initing a job should be enough)
  var xml = build.get('xml');
  data.xml = xml;

  var job = new Job(data);
  this.emit('end', {
    title: this.name,
    number: this.number,
    summary: true,
    job: job.toJSON(),
    build: build.toJSON()
  });
};

BuildPage.prototype.error = function error(err) {
  err = err || new Error('Page raised an error');
  this.emit('error', err);
};
