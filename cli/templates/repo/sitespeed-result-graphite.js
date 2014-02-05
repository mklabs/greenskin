var fs = require('fs');
var Url = require('url');
var exists = fs.existsSync || path.existsSync;

var xml2json = require('xml2js');

var file = process.argv.slice(2)[0];
var prefix = process.argv.slice(2)[1] || 'sitespeed';

if (!exists(file)) {
  console.error('Unable to read file:', file);
  process.exit(1);
  return;
}

var metricPattern = '%prefix.timings.%browser.%protocol.%path.%metric.%stat';
var scorePattern = '%prefix.scores.%protocol.%path.%rule';
var now = Math.floor(Date.now() / 1000);

// Format: graphite or statsd
var format = 'statsd';
// var format = 'graphite';

var xml = fs.readFileSync(file, 'utf8');
xml2json.parseString(xml, function(err, result) {
  if (err) throw err;
  run(result.document);
});

function run(data) {
        // console.log(data);
	var metrics = data.metrics;
	var results = data.results;

	var timingMetrics = getTimingMetrics(metrics);
	var scoreMetrics = getScoreMetrics(results);

	console.log(timingMetrics.join('\n'));
	console.log(scoreMetrics.join('\n'));
}


/** Function helpers **/
function getTimingMetrics(metrics) {
  var data = [];

  if (!metrics) return data;

  metrics = metrics[0].timingSession;

  if (!metrics) return data;

  metrics.forEach(function(m) {
    var stats = m.statistics[0].statistic;

    var pageData = m.pageData[0].entry;

    var browser = pageData.filter(function(entry) {
      return entry.key[0] === 'browserName';
    })[0].value[0];

    var url = pageData.filter(function(entry) {
      return entry.key[0] === 'url';
    })[0].value[0];

    var protocol = Url.parse(url).protocol;
    var href = Url.parse(url).href.replace(/^https?:\/\//, '').replace(/\/$/, '');

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
	return format === 'graphite' ? [metricPath, value, now].join(' ') : metricPath + ':' + value + '|g';
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
    var filename = result['$'].filename;
    var overall = result.o[0];

    var protocol = Url.parse(result.curl[0]).protocol;
    protocol = protocol.replace(/:/g, '');

    var grades = result.g[0];

    var metrics = Object.keys(grades).map(function(g) {
      var d = grades[g][0];
      var score = d.score[0];

      var metricPath = scorePattern
        .replace('%prefix', prefix)
        .replace('%protocol', protocol)
        .replace('%path', filename)
        .replace('%rule', g);

      // node_test.some_service.task.time:500|ms
      return format === 'graphite' ? [metricPath, score, now].join(' ') : metricPath + ':' + score + '|g';
    });

    data = data.concat(metrics);
  });

  return data;
}
