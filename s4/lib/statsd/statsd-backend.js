/*jshint node:true, laxcomma:true */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var exists = fs.existsSync;

var util = require('util');
var debug = require('debug')('gs:statsd:backend');
var async = require('async');

function isNotNaN(num) { return !isNaN(num); }

function FSBackend(startupTime, config, emitter){
  var self = this;
  this.lastFlush = startupTime;
  this.lastException = startupTime;
  this.config = config.console || {};

  this.storage = config.storage || './tmp/metrics';
  debug('Creating file storage', this.storage);
  if (!exists(this.storage)) {
    mkdirp.sync(path.join(this.storage, 'sets'));
    mkdirp.sync(path.join(this.storage, 'gauges'));
  }

  this.timestamp = Date.now();

  // attach
  emitter.on('flush', function(timestamp, metrics) { self.flush(timestamp, metrics); });
  emitter.on('status', function(callback) { self.status(callback); });
}

FSBackend.prototype.flush = function(timestamp, metrics) {
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

exports.init = function(startupTime, config, events) {
  var instance = new FSBackend(startupTime, config, events);
  return true;
};

exports.FSBackend = FSBackend;
