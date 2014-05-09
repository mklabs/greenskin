

// Sadly, statsd doest provide an API or entry point to require, so we
// rely on a spawned provess instead
var statsd = require.resolve('statsd/stats');
var events = require('events');
var spawn  = require('child_process').spawn;
var util   = require('util');
var debug  = require('debug')('gs:statsd');
var path   = require('path');
var Lynx   = require('lynx');

module.exports = StatsD;
StatsD.path = statsd;

function StatsD(options) {
  options = options || {};

  this.options = options;
  this.stdout = options.stdout || process.stdout;
  this.stderr = options.stderr || process.stderr;
  this.config = options.config || path.resolve(__dirname, 'statsd-config.js');

  this.metrics = new Lynx('localhost', 8125, {
    on_error: this.emit.bind(this, 'error')
  });
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

['increment', 'decrement', 'timing', 'gauge', 'set'].forEach(function(method) {
  StatsD.prototype[method] = function() {
    this.metrics.apply(this.metrics, arguments);
  };
});


