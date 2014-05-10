/*jshint node:true, laxcomma:true */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var exists = fs.existsSync;

var util = require('util');
var debug = require('debug')('statsd-fs:backend');
var async = require('async');

var EventEmitter = require('events').EventEmitter;

// Based off statsd console backend, this implementation uses a local
// directory to persist metrics in JSON
module.exports = FSBackend;

// Statsd entry point
FSBackend.init = function init(startupTime, config, events) {
  var instance = new FSBackend(startupTime, config, events);
  return true;
};

function isNotNaN(num) { return !isNaN(num); }

// Our FS backend implem.
function FSBackend(startupTime, config, emitter){
  var self = this;
  this.lastFlush = startupTime;
  this.lastException = startupTime;
  this.config = config.fs || {};
  this.emitter = emitter;

  this.storage = this.config.storage || './tmp/metrics';
  debug('Creating file storage', this.storage);
  if (!exists(this.storage)) {
    mkdirp.sync(path.join(this.storage, 'sets'));
    mkdirp.sync(path.join(this.storage, 'gauges'));
  }

  this.timestamp = Date.now();

  // attach
  emitter.on('flush', this.flush.bind(this));
  emitter.on('status', this.status.bind(this));

  // Bubble up events from internal emitter
  emitter.on('flush', this.emit.bind(this, 'flush'));
  emitter.on('status', this.emit.bind(this, 'flush'));
}

util.inherits(FSBackend, EventEmitter);

FSBackend.prototype.flush = function flush(timestamp, metrics) {
  var out = {
    counters: metrics.counters,
    timers: metrics.timers,
    gauges: metrics.gauges,
    timer_data: metrics.timer_data,
    counter_rates: metrics.counter_rates,
    sets: function (vals) {
      var ret = {};
      for (var val in vals) {
        ret[val] = vals[val].values();
      }
      return ret;
    }(metrics.sets),
    pctThreshold: metrics.pctThreshold
  };

  this.write(timestamp, out);
};

// Only serializing sets for now
FSBackend.prototype.write = function write(timestamp, metrics) {
  var sets = this.sets = metrics.sets;

  var keys = this.keys = Object.keys(sets);

  this.timestamp = timestamp;

  var done = function() {}
  async.each(keys, this.writeKey.bind(this), function(err) {
    if (err) {
      debug('Error flushing data to FS', err);
      process.exit(1);
    }
  });
};

FSBackend.prototype.writeKey = function writeKey(metric, done) {
  var values = this.sets[metric];

  if (!values) return;
  if (!values.length) return;

  // debug('Writing metrics %s:%s to file system', metric, values);

  var file = metric.replace(/\./g, '/');
  var filepath = path.join(this.storage, 'sets', file + '.json');
  var timestamp = this.timestamp;

  this.read(filepath, function(err, data) {
    if (err) return done(err);

    values = values.map(parseFloat).filter(isNotNaN);

    data.name = data.name || path.basename(file);
    data.timestamps = (data.timestamps || []).concat(timestamp);
    data.metrics = (data.metrics || []).concat(values);

    data.raw = (data.raw || []);
    data.raw.push([timestamp].concat(values));

    mkdirp(path.dirname(filepath), function(err) {
      if (err) return done(err);
      fs.writeFile(filepath, JSON.stringify(data), done);
    });
  });
};

FSBackend.prototype.read = function(file, done) {
  fs.readFile(file, 'utf8', function(err, body) {
    if (err) {
      debug('Creating file %s', err, file);
    }

    var data = {};

    try {
      data = body ? JSON.parse(body) : {};
    } catch(e) {
      debug(e);
    }

    done(null, data);
  });
};

FSBackend.prototype.status = function status(write) {
  ['lastFlush', 'lastException'].forEach(function(key) {
    write(null, 'console', key, this[key]);
  }, this);
};
