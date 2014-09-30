
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

  // default from last 24h
  this.from = 86400000;
  this.target = '';
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
  var target = this.target;
  this.buildMetrics(function(err, metrics) {
    if (err) return done(err);

    if (metrics) {
      data._metrics = metrics;
      data.metrics = metrics;

      // Filters out results based on target
      if (target) data.metrics = data.metrics.filter(function(result) {
        return result.target === target;
      }).map(function(result) {
        if (result.target === target) result.selected = true;
        return result;
      });

      data.metrics = data.metrics.map(function(metric, i, arr) {
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
  return conf && conf.median && conf.median.firstView;
};

// Returns an array of metrics object, like so
MetricPage.prototype.buildMetrics = function buildMetrics(done) {
  var query = {};
  query.from = this.from;
  query.key = this.query();

  var me = this;

  var fileurl = this.data.job.url + 'ws/metrics.json';
  // http://192.168.33.12:8080/jenkins/job/kelkoo.fr/ws/metrics.json

  request(fileurl, function(err, response, body) {
    if (err) return done(err);
    if (response.statusCode !== 200) return done(new Error('Cannot find file ' + fileurl));
    var data = JSON.parse(body);
    var series = me.series(data);
    return done(null, series);
  });

};


// Returns an array of array of Series object from grouped data
MetricPage.prototype.series = function _series(data) {
  var results = [];
  var asserts = this.getAsserts() || {};
  results = Object.keys(data).map(function(metric) {
    var metricSeries = data[metric];

    return {
      target: metric,
      assert: asserts[metric],
      xaxis: metricSeries.xaxis,
      series: metricSeries.series
    };
  });

  // Filters out results based on timestamp and from param
  var now = Date.now();
  results = results.map(function(metric) {

    metric.series = metric.series.map(function(serie) {

      if (!serie.data) return;

      serie.data = serie.data.filter(function(data, i) {
        var xaxis = metric.xaxis[i];
        var m = moment(xaxis);
        return (now - xaxis) < this.from;
      }, this);

      return serie;
    }, this);

    metric.xaxis = metric.xaxis.filter(function(xaxis, i) {
      return (now - xaxis) < this.from;
    }, this);

    return metric;
  }, this);

  // Translate timestamp into human readable dates
  results = results.map(function(metric) {
    metric.xaxis = metric.xaxis.map(function(xaxis) {
      var m = moment(xaxis);
      return m.format('MMMM Do YYYY, h:mm a');
    });

    return metric;
  });

  return results;
};