
var debug   = require('debug')('gs:phantomas:metric');

var fs      = require('fs');
var path    = require('path');
var async   = require('async');
var request = require('request');
var util    = require('util');
var events  = require('events');
var moment = require('moment');

// For the tme being, thing of another way to inject this deps, probably
// on instantiation
var Sets = require('../../../../lib/statsd/app/sets');

module.exports = MetricPage;

function MetricPage(config, data) {
  this.config = config || {};
  this.data = data || {};
  this.results = {};
  this.dirname = this.config.storage || path.resolve('tmp/metrics');

  // Some validation
  if (!(config.jenkinsUI)) throw new Error('Missing Jenkins UI config');
  if (!(data.job && data.job.name)) throw new Error('Data not proper structure, job not defined');

  // Handle from parameter, restricting metrics returned based on
  // timestamps
  this.from = this.data.from || '7d';
  this.prefix = data.job.name;
  this._query = '**';
  this.sets = new Sets(path.join(this.dirname, 'sets', this.prefix), {
    from: this.from
  });
}

util.inherits(MetricPage, events.EventEmitter);

MetricPage.prototype.query = function query(value) {
  if (!value) return this._query;
  this._query = value;
  return this;
}

// Page helper for har view
MetricPage.prototype.build = function build(done) {
  var data = this.data;
  this.buildMetrics(function(err, metrics) {
    if (err) return done(err);

    if (metrics) {
      data.metrics = metrics.map(function(metric, i, arr) {
        metric.json = JSON.stringify({
          xaxis: metric.xaxis,
          series: metric.series
        });

        var job = data.job;
        metric.action = '/' + job.type + '/' + job.name + '/metrics';
        metric.name = metric.target;

        metric.colsize = arr.length <= 3 ? 12 : 4;
        metric.expand = arr.length <= 3;

        return metric;
      });

    }

    done(null, data);
  });
};

MetricPage.prototype.getAsserts = function getAsserts() {
  var json = this.data.job.json;
  var conf = this.data.job.jsonConfig;
  return this.data.job && this.data.job.jsonConfig && this.data.job.jsonConfig.asserts;
};

// Returns an array of metrics object, like so
MetricPage.prototype.buildMetrics = function buildMetrics(done) {
  var query = {};
  query.from = this.from;
  query.key = this.query();

  var me = this;
  this.sets.load(query.key, function(err, results) {
    if (err) return done(err);
    var data = me.group(results);
    var series = me.series(data);
    done(null, series);
  });
};

MetricPage.prototype.group = function group(results) {
  var data = {};

  results.forEach(function(result) {
    var target = result.target;
    var parts = target.split(/\./);
    var url = parts[0];
    var metric = parts[1];

    var entry = data[metric] || {};
    // entry[url] = (entry[url] || []).concat(result.data);
    entry[url] = result;
    data[metric] = entry;
  });

  return data;
};

// Returns an array of array of Series object from grouped data
MetricPage.prototype.series = function _series(data) {
  var results = [];
  var asserts = this.getAsserts();
  results = Object.keys(data).map(function(metric) {
    var metricSeries = data[metric];
    var series = Object.keys(metricSeries).map(function(url) {
      var result = metricSeries[url];
      var data = result.data;

      return {
        name: url,
        xaxis: result.categories,
        data: data
      };
    });

    return {
      target: metric,
      assert: asserts[metric],
      xaxis: series[0].xaxis,
      series: series
    };
  });

  return results;
};
