
var jenkins = require('jenkins');
var debug = require('debug')('gs:backend:jenkins');

module.exports = Jenkins;

function Jenkins(options) {
  this.options = options || {};
  if (!this.options.host) throw new Error('Jenkins missing hostname config');
  debug('Init client %s', this.options.host);
  this.client = jenkins(this.options.host);

  // Proxy over part of jenkins package api
  // TODO: on proto
  var defs = [
    { name: 'get', fn: this.client.get },
    { name: 'build', fn: this.client.build.get },
    { name: 'stopBuild', fn: this.client.build.stop },
    { name: 'buildJob', fn: this.client.job.build },
    { name: 'createJob', fn: this.client.job.create },
    { name: 'jobConfig', fn: this.client.job.config },
    { name: 'deleteJob', fn: this.client.job.delete },
    { name: 'disableJob', fn: this.client.job.disable },
    { name: 'enableJob', fn: this.client.job.enable },
    { name: 'existsJob', fn: this.client.job.exists },
    { name: 'getJob', fn: this.client.job.get },
    { name: 'list', fn: this.client.job.list },
    // TODO: node / queue
  ];

  defs.forEach(function(def) {
    this[def.name] = def.fn.bind(jenkins);
  }, this);
}

