
var debug   = require('debug')('gs:phantomas:metric');

var fs      = require('fs');
var path    = require('path');
var async   = require('async');
var request = require('request');
var util    = require('util');
var events  = require('events');
var moment = require('moment');

var app = require('../../app');

module.exports = MetricPage;

function MetricPage(config, data) {
  this.config = config || {};
  this.data = data || {};
  this.results = {};
  this.dirname = path.join(__dirname, '../../../../tmp/metrics');

  // Some validation
  if (!(config.jenkinsUI)) throw new Error('Missing Jenkins UI config');
  if (!(data.job && data.job.name)) throw new Error('Data not proper structure, job not defined');

  // Handle from parameter, restricting metrics returned based on
  // timestamps
  this.from = this.data.from || '7d';
  this.prefix = data.job.name.replace(/\./g, '/');
  this._query = '**';
  this.sets = new app.gs.StatsD.Sets(path.join(this.dirname, 'sets', this.prefix), {
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

  var fileurl = this.data.job.url + 'ws/metrics.json';
  // http://192.168.33.12:8080/jenkins/job/kelkoo.fr/ws/metrics.json

  console.log('Load file', fileurl);

  request(fileurl, function(err, response, body) {
    if (err) return done(err);
    if (response.statusCode !== 200) return done(new Error('Cannot find file ' + fileurl));
    console.log('body', body, typeof body);
    var data = JSON.parse(body);
    console.log('data', data);

    var series = me.series(data);
    console.log(series);

    return done(null, series);
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
  var asserts = this.getAsserts() || {};
  results = Object.keys(data).map(function(metric) {
    var metricSeries = data[metric];
    // var series = Object.keys(metricSeries).map(function(url) {
    //   var result = metricSeries[url];
    //   var data = result.data;
    //
    //   console.log('result', result);
    //   return {
    //     name: url,
    //     xaxis: result.categories,
    //     data: data
    //   };
    // });

    return {
      target: metric,
      assert: asserts[metric],
      xaxis: metricSeries.xaxis,
      series: metricSeries.series
    };
  });

  return results;
};
