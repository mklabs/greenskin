

// Sadly, statsd doest provide an API or entry point to require, so we
// rely on a spawned provess instead
//
// This is also where we ensure statsd is using our special backend to
// store the results back to file storage:  /tmp/metrics by default.

var statsd = require.resolve('statsd/stats');
var events = require('events');
var spawn  = require('child_process').spawn;
var util   = require('util');
var debug  = require('debug')('statsd-fs');
var path   = require('path');

module.exports = StatsD;
StatsD.path = statsd;
StatsD.app = require('./app');

function StatsD(options) {
  options = options || {};

  this.options = options;
  this.stdout = options.stdout || process.stdout;
  this.stderr = options.stderr || process.stderr;
  this.config = options.config || path.resolve(__dirname, 'statsd-config.js');
}

util.inherits(StatsD, events.EventEmitter);

StatsD.prototype.run = function run() {
  this.args = this.buildArgs();
  var p = this.process = spawn('node', this.args);

  p.stdout.pipe(this.stdout);
  p.stderr.pipe(this.stderr);

  p.on('exit', this.emit.bind(this, 'exit'));
  p.on('error', this.emit.bind(this, 'error'));
  p.on('close', this.emit.bind(this, 'close'));
  return this;
};

StatsD.prototype.buildArgs = function buildArgs() {
  var args = [StatsD.path];
  args.push(this.config);
  return args;
};
