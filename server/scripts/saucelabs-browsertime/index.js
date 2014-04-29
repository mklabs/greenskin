
var fs     = require('fs');
var wd     = require('wd');
var path   = require('path');
process.env.DEBUG = process.env.DEBUG || 'sauce-browsertime';
var debug  = require('debug')('sauce-browsertime');

// checking sauce credential

if (!username || !accesskey) {
  console.warn(
    '\nPlease configure your sauce credential:\n\n' +
    'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
    'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
  );

  throw new Error('Missing sauce credentials');
}

// Config

var nopt = require('nopt')({
  hostname: String,
  port: Number,
  browser: String,
  platform: String,
  'device-type': String,
  'device-orientation': String,
  'version': String
});

var username = process.env.SAUCE_USERNAME;
var accesskey = process.env.SAUCE_ACCESS_KEY;

var webdriverHost = nopt.hostname || 'ondemand.saucelabs.com';
var webdriverPort = nopt.port || 80;

var url = nopt.argv.remain[0];
if (!url) throw new Error('Missing URL(s)');

// Injected script
var snippet = "window.performance ? (window.performance.toJSON ? JSON.stringify(window.performance.toJSON()) : window.performance) : '{}'";

// http configuration, not needed for simple runs
wd.configureHttp( {
  timeout: 60000,
  retryDelay: 15000,
  retries: 5
});

var desired = { browserName: nopt.browser || 'chrome' };
desired.name = 'Collecting Navigation Timings with ' + desired.browserName;
desired.tags = ['navtiming'];
if (nopt.platform) desired.platform = nopt.platform;
if (nopt.version) desired.version = nopt.version;
if (nopt['device-type']) desired['device-type'] = nopt['device-type'];
if (nopt['device-orientation']) desired['device-orientation'] = nopt['device-orientation'];

// Run

var browser = wd.remote(webdriverHost, webdriverPort, username, accesskey);

var urls = nopt.argv.remain.concat();
collect(urls, desired, function(err, data) {
  if (err) return done(err);
  console.log(data);
  console.log('end');
});

function collect(urls, desired, done) {
  var data = [];
  var arr = urls.concat();

  debug('Init browser', desired);
  browser.init(desired, function(err, id, caps) {
    if (err) return done(err);

    function end() {
      debug('Ending session %s', id);
      browser.quit(function(err) {
        if (err) return done(err);
        browser.sauceJobStatus(true);
        done(null, data);
      });
    }

    debug('Session %s', id);
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

function collectURL(url, done) {
  debug('Getting %s url', url);
  browser.get(url, function(err) {
    if (err) return done(err);

    debug('Collecting navigation timings for %s', url);
    browser.safeExecute(snippet, function(err, res) {
      if (err) return done(err);
      debug('Nav timings collected for %s', url);
      var data = typeof res === 'string' ? res :
        JSON.stringify(res.timing, null, 2);

      done(null, data);
    });
  });
}
