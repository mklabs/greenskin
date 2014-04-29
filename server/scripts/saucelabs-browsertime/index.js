
var fs     = require('fs');
var wd     = require('wd');
var path   = require('path');
process.env.DEBUG = process.env.DEBUG || 'sauce-browsertime';
var debug  = require('debug')('sauce-browsertime');
var EventEmitter = require('events').EventEmitter;

var username = process.env.SAUCE_USERNAME;
var accesskey = process.env.SAUCE_ACCESS_KEY;
var webdriverHost = 'ondemand.saucelabs.com';
var webdriverPort = 80;

// Config

var options = {
  browser: String,
  platform: String,
  type: String,
  orientation: String,
  version: String,
  reporter: String,
  hostname: String,
  port: Number,
  help: Boolean
};

var shorthands = {
  b: '--browser',
  p: '--platform',
  t: '--type',
  o: '--orientation',
  R: '--reporter',
  v: '--version',
  H: '--hostname',
  h: '--help'
};

var nopt = require('nopt')(options, shorthands);
var help = require('./lib/nopt-help');

if (nopt.help) return help(options, shorthands, { program: 'sauce-browsertime' })
  .desc('browser', 'Saucelabs browser (default: chrome)')
  .desc('version', 'Saucelabs browser version (default: unspecified)')
  .desc('platform', 'Saucelabs platform (default: unspecified)')
  .desc('type', 'Saucelabs device type (default: unspecified)')
  .desc('orientation', 'Saucelabs device orientation (default: unspecified)')
  .desc('hostname', 'Webdriver-grid hostname (default: ' + webdriverHost + ')')
  .desc('reporter', 'Mocha reporter (default: json)')
  .desc('port', 'Specify webdriver-grid port (default: 80)')
  .usage(function() {
    console.log('Usage: sauce-browsertime [options] [urls, ...]');
    console.log('');
    console.log('    $ sauce-browsertime http://example.com');
    console.log('    $ sauce-browsertime http://example.com/page-one http://example.com/page-two');
    console.log('    $ sauce-browsertime http://example.com/page-one --browser android');
    console.log('');
    console.log('See https://saucelabs.com/platforms for the list of available OS / Browser / Version');
    console.log('');
  });


var webdriverHost = nopt.hostname || 'ondemand.saucelabs.com';
var webdriverPort = nopt.port || 80;

var url = nopt.argv.remain[0];
if (!url) throw new Error('Missing URL(s)');

// checking sauce credential
if (!username || !accesskey) {
  console.warn(
    '\nPlease configure your sauce credential:\n\n' +
    'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
    'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
  );

  throw new Error('Missing sauce credentials');
}

// http configuration, not needed for simple runs
wd.configureHttp( {
  timeout: 60000,
  retryDelay: 15000,
  retries: 5
});

var desired = { browserName: nopt.browser || 'chrome' };
desired.name = 'Collecting Navigation Timings with ' + desired.browserName;
desired.tags = ['sauce-browsertime'];
if (nopt.platform) desired.platform = nopt.platform;
if (nopt.version) desired.version = nopt.version;
if (nopt.type) desired['device-type'] = nopt.type;
if (nopt.orientation) desired['device-orientation'] = nopt.orientation;
if (nopt.hostname) webdriverHost = nopt.hostname;
if (nopt.port) webdriverPort = nopt.port;

// Run

var runner = new EventEmitter();

var mocha = require('mocha');
var Test = mocha.Test;
var Reporter = loadReporter(nopt.reporter);
var reporter = new Reporter(runner);

var browser = wd.remote(webdriverHost, webdriverPort, username, accesskey);

var urls = nopt.argv.remain.concat();
collect(urls, desired, function(err, data) {
  if (err) return done(err);
});


function collect(urls, desired, done) {
  var data = [];
  var arr = urls.concat();


  runner.emit('start');
  runner.emit('suite', { title: desired.name });

  debug('Init browser', desired);
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
      collectURL(url, function(err, res) {
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
}

// Injected script
var snippet = "window.performance ? JSON.stringify(window.performance.toJSON ? window.performance.toJSON() : window.performance.timing) : '{}'";
function collectURL(url, done) {
  debug('Getting %s url', url);

  var test = new Test(desired.name + ' - ' + url);
  test.parent = { fullTitle: function() { return url; } };

  runner.emit('test', test);
  browser.get(url, function(err) {
    if (err) return done(err);

    debug('Collecting navigation timings for %s', url);

    browser.safeExecute(snippet, function(err, res) {
      if (err) return done(err);
      debug('Nav timings collected for %s', url);
      var data = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      runner.emit('pass', test);
      runner.emit('test end', test);
      done(null, data);
    });
  });
}

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
