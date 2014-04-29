
var wd     = require('wd');
var debug  = require('debug')('sauce-browsertime');
var mocha = require('mocha');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Test = mocha.Test;

// http configuration, not needed for simple runs
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

browsertime.run = function run(argv, opts, done) {
  done = done || function() {};
  var desired = opts.desired;

  var runner = new Browsertime(opts);
  debug('Init tests on %d urls', argv.length);
  runner.collect(argv, desired, done);
  return runner;
};

function Browsertime(opts) {
  this.opts = opts || {};
  // Mocha reporter
  this.suite = new mocha.Suite(opts.desired.name);
  this._reporter = loadReporter(this.opts.reporter);
  this.reporter = new this._reporter(this);
  // Initing browser remote
  this.browser = wd.remote(
    this.opts.hostname,
    this.opts.port,
    this.opts.username,
    this.opts.accesskey
  );
}

util.inherits(Browsertime, mocha.Runner);

Browsertime.prototype.collect = function collect(urls, desired, done) {
  var data = [];
  var arr = urls.concat();

  var runner = this;

  runner.emit('start');
  runner.emit('suite', this.suite);

  debug('Init browser', desired);
  var browser = this.browser;
  browser.init(desired, function(err, id, caps) {
    if (err) return done(err);

    function end() {
      runner.emit('suite end', { title: desired.name });
      runner.emit('end', { title: desired.name });

      debug('Ending session %s', id);
      browser.quit(function(err) {
        if (err) return done(err);
        browser.sauceJobStatus(true);
        done(null, data);
      });
    }

    debug('Session ID %s', id);
    debug('Test URL: %s', 'https://saucelabs.com/tests/' + id);

    // Basic async each
    (function boom(url) {
      if (!url) return end();
      runner.collectURL(url, desired, function(err, json, res) {
        if (err) return done(err);
        data.push({
          url: url,
          platform: desired,
          timings: res
        });

        boom(arr.shift());
      });
    })(arr.shift());
  });
};

Browsertime.prototype.collectURL = function collectURL(url, desired, done) {
  debug('Getting %s url', url);
  var runner = this;
  var browser = this.browser;

  var test = new Test(desired.name + ' - ' + url, collectURL);
  test.parent = { fullTitle: function() { return url; } };

  runner.emit('test', test);
  browser.get(url, function(err) {
    if (err) return done(err);

    debug('Collecting navigation timings for %s', url);

    browser.safeExecute(browsertime.snippet, function(err, res) {
      if (err) return done(err);
      debug('Nav timings collected for %s', url);
      var data = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      test.fn.toString = function() { return data; };
      // Tricking mocha into displaying our data in reporters (json mainly)
      test.duration = JSON.parse(data);
      runner.emit('pass', test);
      runner.emit('test end', test);
      done(null, data, test.duration);
    });
  });
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
