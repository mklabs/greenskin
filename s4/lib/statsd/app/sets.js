
var fs     = require('fs');
var path   = require('path');
var debug  = require('debug')('statsd-fs:sets');
var glob   = require('glob')
var util   = require('util');
var async  = require('async');
var moment = require('moment');
var Glob   = glob.Glob;

var EventEmitter = require('events').EventEmitter;
// TODO: Implement Cache
var cache = {};

module.exports = Sets;

function Sets(dirname, options) {
  this.options = options || {};
  this.base = dirname;
  if (!this.base) throw new Error('Sets: Missing base directory');

  this.prefix = this.options.prefix || '';
  this.files = [];
  this.data = [];

  this.parseFrom(this.options.from);

  this.options.format = this.options.format || 'LLL';
}

util.inherits(Sets, EventEmitter);

Sets.prototype.parseFrom = function parseFrom(from) {
  from = from || '7d';

  this.fromNum = parseFloat((from.match(/\d+/) || [])[0]);
  this.fromUnit = (from.match(/[a-z]+/) || [])[0];
  if (isNaN(this.fromNum)) throw new Error(from + ' wrong syntax');

  this.from = moment().subtract(this.fromUnit, this.fromNum);
};

Sets.prototype.load = function load(query, done) {
  debug('Look for matches in %s dir. Query: %s', this.base, query);
  this.glob = new Glob(this.pattern(query), {
    cwd: this.base
  });

  this.glob.on('match', this.emit.bind(this, 'match'));
  this.glob.on('error', this.emit.bind(this, 'error'));
  this.glob.on('abort', this.emit.bind(this, 'abort'));

  var me = this;
  this.glob.on('end', function(files) {
    files = files.filter(function(file) {
      return path.extname(file) === '.json';
    });

    me.files = files;
    me.loadFiles(files, function(err, data) {
      if (err) return done(err);
      me.data = data;
      var res = me.format(data);
      me.emit('end', res);
      done(null, res);
    });
  });
};

// Turn the response into a graphite like format (target / datapoints), also adding our own
// stuff (data)
Sets.prototype.format = function format(data, raw) {
  if (raw) return data;

  return data.filter(function(entry) {
    return entry.raw.length;
  }).map(function(entry) {
    var target = entry.key.replace(/\.json$/, '')
    var points = entry.data.raw.map(function(point) {
      return point.reverse();
    });

    var data = points.map(function(raw) {
      return raw[0];
    });

    var categories = points.map(function(raw) {
      return moment(raw[1] * 1000).format(this.options.format);
    }, this);

    return {
      target: target,
      datapoints: points,
      categories: categories,
      data: data
    };
  }, this);
};

Sets.prototype.loadFiles = function loadFiles(files, done) {
  var me = this;
  async.map(files, this.loadFile.bind(this), function(err, results) {
    if (err) return done(err);
    done(null, results);
  });
};

Sets.prototype.loadFile = function loadFile(file, done) {
  var me = this;

  // Load from cache
  if (cache[file]) {
    return done(null, me.parse(file, cache[file]));
  }

  // First hit
  fs.readFile(this.path(file), 'utf8', function(err, body) {
    if (err) return done(err);
    cache[file] = body;

    var data = me.parse(file, body);
    done(null, data);
  });
};

Sets.prototype.filterFrom = function filterFrom(raw) {
  var from = this.from;
  if (!from) return true;

  var timestamp = raw[0];
  var value = raw[1];

  var momentMetric = moment(timestamp * 1000);
  var ok = !momentMetric.isBefore(from);
  // debug('Filtering', ok, timestamp, momentMetric.format('LT'), from.format('LT'));
  return ok;
};

Sets.prototype.parse = function parse(file, res) {
  var data = {};
  var ext = path.extname(file);
  data.name = path.basename(file).replace(ext, '');


  data.key = file.replace(/\//g, '.');

  try {
    data.data = JSON.parse(res);
    data.data.raw = data.data.raw.filter(this.filterFrom, this);
    data.raw = data.data.raw.reduce(function(a, b) {
      a = a.concat(b);
      return a;
    }, []);
  } catch(e) {
    debug('ERR parsing JSON:', e);
  }

  return data;
};

var abs = path.resolve('/');
Sets.prototype.path = function _path(file) {
  if (file.indexOf(abs) === 0) return file;
  return path.join(this.base, file);
}

Sets.prototype.pattern = function pattern(query) {
  if (!query) return '**.json';

  var p = query.replace(/\./g, '/');
  if (p.charAt(p.length - 1) !== '*') p = p + '.json';
  debug('Pattern', p);
  return p;
};
