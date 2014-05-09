
var debug   = require('debug')('gs:phantomas:metric');

var fs      = require('fs');
var path    = require('path');
var async   = require('async');
var request = require('request');
var util    = require('util');
var events  = require('events');
var moment = require('moment');

module.exports = MetricPage;

function MetricPage(config, data) {
  this.config = config || {};
  this.data = data || {};
  this.results = {};
  this.dirname = this.config.storage || path.resolve('tmp/metrics');
  this.from = this.data.from || '7d';

  this.fromNum = parseFloat((this.from.match(/\d+/) || [])[0]);
  this.fromUnit = (this.from.match(/[a-z]+/) || [])[0];

  if (isNaN(this.fromNum)) throw new Error(this.from + ' wrong syntax');

  this.from = moment().subtract(this.fromUnit, this.fromNum);

  debug('From, ', this.data.from, this.fromNum, this.fromUnit);
  debug('from', this.from);

  if (!(config.jenkinsUI)) throw new Error('Missing Jenkins UI config');
  if (!(data.job && data.job.name)) throw new Error('Data not proper structure, job not defined');

  this.workspace = config.jenkinsUI + [
    'job',
    data.job.name,
    'ws'
  ].join('/').replace(/\/\/+/, '/');
}

util.inherits(MetricPage, events.EventEmitter);

// Page helper for har view
MetricPage.prototype.build = function build(done) {
  var data = this.data;
  this.buildMetrics(function(err, metrics) {
    if (err) return done(err);
    if (metrics) data.metrics = metrics;
    done(null, data);
  });
};

MetricPage.prototype.getAsserts = function getAsserts() {
  var json = this.data.job.json;
  var conf = this.data.job.jsonConfig;
  return this.data.job && this.data.job.jsonConfig && this.data.job.jsonConfig.asserts;
};

MetricPage.prototype.buildMetrics = function buildMetrics(done) {
  var dirname = path.join(this.dirname, 'sets', this.data.job.name);
  var buildfile = this.workspace + '/build.json';
  var from = this.from;
  var asserts = this.getAsserts();

  request({ url: buildfile, json: true }, function(err, res, buildData) {
    if (err) return done(err);

    if (!Array.isArray(buildData)) return done();

    var data = {};

    async.map(buildData, function(build, done) {
      var metrics = build.metrics;

      var keys = Object.keys(metrics);

      async.each(keys, function(key, next) {
        var filepath = path.join(dirname, build.prefix, key + '.json');

        fs.readFile(filepath, 'utf8', function(err, body) {
          if (err) return next(err);
          var json = {};
          try {
            json = JSON.parse(body);
          } catch(e) {
            return next(err);
          }

          var series = data[key] = (data[key] || {});

          json.metrics = json.metrics.map(parseFloat);

          var serie = series.series ? series.series.filter(function(serie) {
            return serie.name === build.url;
          })[0] : null;

          if (!serie) {
            serie = {};
            serie.name = build.url;
            series.series = (series.series || []).concat(serie);
          }


          var raw = json.raw.filter(function(raw) {
            var m = moment(raw[0] * 1000);
            return !m.isBefore(from);
          });

          series.timestamps = raw.map(function(raw) {
            return raw[0] * 1000;
          });

          serie.data = raw.map(function(raw) {
            return raw[1];
          }).reduce(function(a, b) {
            return a.concat(b);
          }, []).map(parseFloat);

          next();
        });
      }, done);
    }, function(err) {
      if (err) return done(err);
      data = Object.keys(data).reduce(function(arr, key) {
        var series = data[key];

        arr = arr.concat({
          name: key,
          series: series.series,
          timestamps: series.timestamps,
          assert: asserts[key],
          json: JSON.stringify({
            xaxis: series.timestamps.map(function(t) {
              return moment(t).format('LLL');
            }),
            series: series.series
          })
        });
        return arr;
      }, []);

      data = data.sort(function(a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });

      done(null, data);
    });
  });
};
