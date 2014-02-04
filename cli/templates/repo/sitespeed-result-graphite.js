var fs = require('fs');
var Url = require('url');
var exists = fs.existsSync || path.existsSync;
var xml2json = require('xml2json');

var file = process.argv.slice(2)[0];
var prefix = process.argv.slice(2)[1];

if (!exists(file)) {
  console.error('Unable to read file:', file);
  process.exit(1);
  return;
}

var json = xml2json.toJson(fs.readFileSync(file));
var data = JSON.parse(json).document;

var metrics = data.metrics.timingSession;
var results = data.results;

var metricPattern = '%prefix.timings.%browser.%protocol.%path.%metric.%stat';
var scorePattern = '%prefix.scores.%protocol.%path.%rule';

var now = Math.floor(Date.now() / 1000);
var timingMetrics = getTimingMetrics(metrics);
var scoreMetrics = getScoreMetrics(results);

/** Function helpers **/
function getTimingMetrics(metrics) {

  var data = [];

  metrics.forEach(function(m) {
    var stats = m.statistics.statistic;

    var browser = m.pageData.entry.filter(function(entry) {
      return entry.key === 'browserName';
    })[0].value;

    var url = m.pageData.entry.filter(function(entry) {
      return entry.key === 'url';
    })[0].value;

    var protocol = Url.parse(url).protocol;
    var href = Url.parse(url).href.replace(/^https?:\/\//, '').replace(/^\//, '');

    var pathname = href.replace(/[\.\/\?\=\+]/g, '-').replace(/(&amp;)/g, '-');
    protocol = protocol.replace(/:/g, '');

    stats.forEach(function(stat) {
      var name = stat.name;
      var keys = Object.keys(stat).filter(function(stat) {
        return stat !== 'name';
      }).map(function(k) {
        var metricPath = metricPattern
          .replace('%prefix', prefix)
          .replace('%browser', browser)
          .replace('%protocol', protocol)
          .replace('%path', pathname)
          .replace('%metric', name)
          .replace('%stat', k);

        var value = Math.floor(stat[k]);
        return [metricPath, value, now].join(' ');
      });

      data = data.concat(keys);
    });
  });

  return data;
}

function getScoreMetrics(results) {
  var data = [];

  // If only one page analyzed, results is an Object instead of array
  results = Array.isArray(results) ? results : [results];

  results.forEach(function(result) {
    var filename = result.filename;
    var overall = result.o;

    var protocol = Url.parse(result.curl).protocol;
    protocol = protocol.replace(/:/g, '');

    var grades = result.g;

    var metrics = Object.keys(grades).map(function(g) {
      var d = grades[g];
      var score = d.score;

      var metricPath = scorePattern
        .replace('%prefix', prefix)
        .replace('%protocol', protocol)
        .replace('%path', filename)
        .replace('%rule', g);

      return [metricPath, score, now].join(' ');
    });

    data = data.concat(metrics);
  });

  return data;
}

console.log(timingMetrics.join('\n'));
console.log(scoreMetrics.join('\n'));
