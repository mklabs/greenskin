/*jshint node:true, laxcomma:true */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var exists = fs.existsSync;

var util = require('util');
var debug = require('debug')('gs:statsd:backend');

function ConsoleBackend(startupTime, config, emitter){
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

  // attach
  emitter.on('flush', function(timestamp, metrics) { self.flush(timestamp, metrics); });
  emitter.on('status', function(callback) { self.status(callback); });
}

ConsoleBackend.prototype.flush = function(timestamp, metrics) {

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

ConsoleBackend.prototype.write = function write(timestamp, metrics) {
  var sets = metrics.sets;

  var keys = Object.keys(sets);
  //.slice(0, 10);

  keys.forEach(function(metric) {
    var values = sets[metric];

    if (!values) return;
    if (!values.length) return;

    debug('Writing metrics %s:%s to file system', metric, values);

    var file = metric.replace(/\./g, '/');
    var filepath = path.join(this.storage, 'sets', file + '.json');

    mkdirp(path.dirname(filepath), function(err) {
      if (err) {
        // debug('Error Creating directory', err);
        return;
      }

      fs.readFile(filepath, function(err, body) {
        if (err) {
          debug('Creating file %s', err, filepath);
        }

        var data = {};

        try {
          data = body ? JSON.parse(body) : {};
        } catch(e) {
          debug(e);
        }

        data.name = data.name || path.basename(file);
        data.timestamps = (data.timestamps || []).concat(timestamp);
        data.metrics = (data.metrics || []).concat(values);

        data.raw = (data.raw || []);
        data.raw.push([timestamp, values]);

        fs.writeFile(filepath, JSON.stringify(data), function(err) {
          if (err) {
            debug('ERR', err);
          }
        });
      });

    });
  }, this);
};

ConsoleBackend.prototype.status = function(write) {
  ['lastFlush', 'lastException'].forEach(function(key) {
    write(null, 'console', key, this[key]);
  }, this);
};

exports.init = function(startupTime, config, events) {
  var instance = new ConsoleBackend(startupTime, config, events);
  return true;
};
