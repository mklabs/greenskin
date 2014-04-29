
var fs     = require('fs');
var wd     = require('wd');
var path   = require('path');
process.env.DEBUG = process.env.DEBUG || 'sauce-browsertime';
var debug  = require('debug')('sauce-browsertime');

var nopt = require('nopt')({
  browser: String
});

var username = process.env.SAUCE_USERNAME;
var accesskey = process.env.SAUCE_ACCESS_KEY;

var webdriverHost = 'ondemand.saucelabs.com';
var webdriverPort = 80;
var url = process.argv.slice(2)[0];

var snippet = "window.performance ? (window.performance.toJSON ? JSON.stringify(window.performance.toJSON()) : window.performance) : '{}'";

// Based on https://github.com/saucelabs/grunt-init-sauce/blob/master/root/test/sauce/name-specs.js

// checking sauce credential
if (!username || !accesskey) {
  console.warn(
    '\nPlease configure your sauce credential:\n\n' +
    'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
    'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
  );

  throw new Error('Missing sauce credentials');
}

if (!url) throw new Error('Missing URL');

// http configuration, not needed for simple runs
wd.configureHttp( {
  timeout: 60000,
  retryDelay: 15000,
  retries: 5
});

// Hmm: http://saucelabs.com/rest/v1/info/browsers/webdriver
var desired = { browserName: nopt.browser || 'chrome' };
desired.name = 'Collecting Navigation Timings with ' + desired.browserName;
desired.tags = ['navtiming'];

// Run

var browser = wd.remote(webdriverHost, webdriverPort, username, accesskey);

function done(err) {
  if (err) throw err;
}

debug('Init browser', desired);
browser.init(desired, function(err, id, caps) {
  if (err) return done(err);
  debug('Session %s', id);

  debug('Getting %s url', url);
  browser.get(url, function(err) {
    if (err) return done(err);

    debug('Collecting navigation timings');
    browser.safeExecute(snippet, function(err, res) {
      if (err) return done(err);
      debug('Nav timings collected, writing to STDOUT');
      if (typeof res === 'string') console.log(res);
      else console.log(JSON.stringify(res.timing, null, 2));
      debug('Finishing session');
      browser.quit(function(err) {
        if (err) return done(err);
        browser.sauceJobStatus(true);
        done();
      });
    });
  });
});
