
var fs           = require('fs');
var path         = require('path');
var wd           = require('wd');
var debug        = require('debug')('sauce-browsertime');
var mocha        = require('mocha');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var Intervals    = require('./lib/intervals');
var Stats        = require('./lib/stats');
var exists       = fs.existsSync || path.existsSync;

var Test = mocha.Test;

// http configuration
wd.configureHttp( {
  timeout: 60000,
  retryDelay: 15000,
  retries: 5
});

// Public API
var browsertime = module.exports;

// Injected script
browsertime.snippet = "window.performance ? JSON.stringify(window.performance.toJSON ? window.performance.toJSON() : window.performance.timing, null, 2) : '{}'";
browsertime.Browsertime = Browsertime;
browsertime.Intervals = Intervals;
browsertime.Stats = Stats;

browsertime.run = function run(argv, opts, done) {
  done = done || function() {};
  var desired = opts.desired;

  var fromFile = argv.length === 1 && path.extname(argv[0]) === '.txt';
  var file = argv[0];
  if (file && exists(file)) {
    argv = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    debug('Loading URLs from %s file', file);
  }

  var runner = new Browsertime(opts);
  runner.emit('start');
  debug('Init tests on %d urls', argv.length);
  runner.collect(argv, desired, function(err, data, caps) {
    if (err) return done(err);

    var stats = data.map(function(result) {
      return {
        url: result.url,
        timings: result.stats
      };
    }).reduce(function(results, result) {
      results[result.url] = result.timings;
      return results;
    }, {});

    // Hack around Mocha reporter to include our own stats into the reporter output (json mainly)
    if (runner.reporter && runner.reporter.stats) {
      runner.reporter.stats.timings = stats;
      runner.reporter.stats.caps = caps;
    }

    // Kick off assert suites
    Object.keys(stats).forEach(function(url) {
      runner.asserts(url, stats[url]);
    });

    done(null, {
      caps: caps,
      stats: stats,
      data: data
    });

    runner.emit('end', runner.suite);
  });

  return runner;
};

function Browsertime(opts) {
  this.opts = opts || {};
  this.opts.runs = this.opts.runs || 1;

  // Initing browser remote
  this.browser = wd.remote(
    this.opts.hostname,
    this.opts.port,
    this.opts.username,
    this.opts.accesskey
  );

  // Mocha reporter
  this.suite = new mocha.Suite(opts.desired.name);
  this._reporter = loadReporter(this.opts.reporter);
  this.reporter = new this._reporter(this);
}

util.inherits(Browsertime, mocha.Runner);

Browsertime.prototype.collect = function collect(urls, desired, done) {
  var data = [];
  var arr = urls.concat();

  var runner = this;

  var suite = this.suite;
  runner.emit('suite', suite);

  debug('Init browser', desired);
  var browser = this.browser;
  browser.init(desired, function(err, id) {
    if (err) return done(err);

    function end() {
      runner.emit('suite end', suite);

      debug('Ending session %s', id);
      browser.sessionCapabilities(function(err, caps) {
        if (err) return done(err);
        browser.quit(function(err) {
          if (err) return done(err);
          browser.sauceJobStatus(true);
          done(null, data, caps);
        });
      });
    }

    debug('Session ID %s', id);
    debug('Test URL: %s', 'https://saucelabs.com/tests/' + id);

    // Basic async each
    (function boom(url) {
      if (!url) return end();

      var runSuite = runner._suite = mocha.Suite.create(suite, url);
      runner.emit('suite', runSuite);
      runner.collectURL(url, desired, function(err, results) {
        if (err) return done(err);
        var metrics = results.map(function(res) {
          return res.duration;
        });

        // var keys = Object.keys(metrics.intervals);
        var intervals = metrics.map(function(metric) {
          return metric.intervals;
        });

        var keys = Object.keys(intervals[0]);
        var stats = keys.map(function(key) {
          var list = intervals.map(function(interval) {
            return interval[key];
          });

          var st = new Stats(key, list);
          return st.toJSON();
        });

        data.push({
          url: url,
          platform: desired,
          data: metrics,
          stats: stats.reduce(function(a, stat) {
            var n = stat.name;
            delete stat.name;
            a[n] = stat;
            return a;
          }, {})
        });

        runner.emit('suite end', runSuite);
        boom(arr.shift());
      });
    })(arr.shift());
  });
};

Browsertime.prototype.collectURL = function collectURL(url, desired, done) {
  debug('Getting %s url', url);
  var runner = this;
  var browser = this.browser;

  debug('Number of runs', this.opts.runs);
  var runs = this.opts.runs;
  var run = 0;
  var results = [];
  (function baam() {
    if (run === runs) return done(null, results);
    run++;

    debug('#%d %s', run, url);
    var test = new Test(url + ' #' + run, baam);
    test.parent = { fullTitle: function() { return run; } };

    if (runner._suite) runner._suite.addTest(test);

    runner.emit('test', test);
    browser.get(url, function(err) {
      if (err) return done(err);

      debug('Collecting navigation timings for %s', url);
      browser.safeExecute(browsertime.snippet, function(err, res) {
        if (err) return done(err);
        debug('Nav timings collected for %s', url);
        var json = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
        var intervals = new Intervals(JSON.parse(json));
        var data = intervals.toJSON();
        // Tricking mocha into displaying our data in reporters (json mainly)
        test.duration = data;

        test.fn.toString = function() { return JSON.stringify(data, null, 2); };
        runner.emit('pass', test);
        runner.emit('test end', test);

        results.push(test);
        baam();
      });
    });
  })();
};

Browsertime.prototype.asserts = function _asserts(url, stats) {
  var asserts = this.parseAsserts(this.opts);
  if (!asserts.length) return;

  var suite = mocha.Suite.create(this.suite, 'Asserts - ' + url);

  var runner = this;
  runner.emit('suite', suite);

  asserts.forEach(function me(assert) {
    var assertion = this.makeAssertion(stats, assert);

    var title = util.format('Assert %s <= %d (Value: %d)', assertion.metricName, assert.value, assertion.metric);
    var test = new Test(title, assertion);
    test.parent = { fullTitle: function() { return assert.name; } };
    suite.addTest(test);
    runner.emit('test', test);

    test.run(function(err) {
      if (err) runner.emit('fail', test, err);
      else runner.emit('pass', test);

      runner.emit('test end', test);
    });
  }, this);

  runner.emit('suite end', suite);
};

Browsertime.prototype.makeAssertion = function makeAssertion(data, assert) {
  // Normalize stats key down to lower case, to ease the match
  var stats = Object.keys(data).map(function(metric) {
    return {
      name: metric.toLowerCase().replace(/time$/, ''),
      data: data[metric]
    };
  }).reduce(function(a, b) {
    a[b.name] = b.data;
    return a;
  }, {});

  var parts = assert.name.split('-');
  var name = parts[0].toLowerCase().replace(/time$/, '');
  var stat = parts[1] || 'avg';
  var metric = stats[name];
  var value = metric && metric[stat];

  var fn = function assertion() {
    if (typeof value === 'undefined') throw new Error('Cannot find ' + name + ' ' + stat + ' value.\n' + JSON.stringify(stats, null, 2));
    if (isNaN(value)) throw new Error(name + ' ' + stat + ' value is not a number: ' + value);

    var ok = value <= assert.value;
    var msg = util.format('Assert %s <= %d (Value: %d)', assert.name, assert.value, value);

    debug('Assert %s %s', assert.name, ok ? 'OK' : 'NOK');
    if (!ok) throw new Error(msg);
  };

  fn.metric = parseFloat(value).toFixed(2);
  fn.metricName = name + ' ' + stat;

  return fn;
};

Browsertime.prototype.parseAsserts = function parseAsserts(opts) {
  var r = /^assert-/;
  return Object.keys(opts).filter(function(option) {
    return r.test(option);
  }).map(function(option) {
    return {
      name: option.replace(r, ''),
      value: parseFloat(opts[option]).toFixed(2)
    };
  });
  // .reduce(function(options, option) {
  //   options[option.name] = option.value;
  //   return options;
  // }, {});
};

// Loading helpers for Mocha reporters
function loadReporter(reporter) {
  if (typeof reporter === 'function') return reporter;

  reporter = reporter || 'json';
  var _reporter;
  try { _reporter = require('mocha/lib/reporters/' + reporter); } catch (err) {}
  if (!_reporter) try { _reporter = require(reporter); } catch (err) {}
  if (!_reporter && reporter === 'teamcity')
    console.warn('The Teamcity reporter was moved to a package named ' +
      'mocha-teamcity-reporter ' +
      '(https://npmjs.org/package/mocha-teamcity-reporter).');
  if (!_reporter) throw new Error('invalid reporter "' + reporter + '"');
  return _reporter;
}
