
var jenkins = require('jenkins');
var debug = require('debug')('gs:backend:jenkins');

module.exports = Jenkins;

function Jenkins(options) {
  this.options = options || {};
  if (!this.options.host) throw new Error('Jenkins missing hostname config');
  debug('Init client %s', this.options.host);
  this.client = jenkins(this.options.host);
  this.host = this.options.host;

  // Proxy over part of jenkins package api
  // TODO: on proto
  var defs = [
    { name: 'jenkins', fn: this.client.get },
    { name: 'build', fn: this.client.build.get },
    { name: 'stop', fn: this.client.build.stop },
    { name: 'run', fn: this.client.job.build },
    { name: 'create', fn: this.client.job.create },
    { name: 'config', fn: this.client.job.config },
    { name: 'delete', fn: this.client.job.delete },
    { name: 'disable', fn: this.client.job.disable },
    { name: 'enable', fn: this.client.job.enable },
    { name: 'exists', fn: this.client.job.exists },
    { name: 'get', fn: this.client.job.get },
    { name: 'list', fn: this.client.job.list }
    // TODO: node / queue
  ];

  defs.forEach(function(def) {
    this[def.name] = def.fn.bind(jenkins);
  }, this);
}

