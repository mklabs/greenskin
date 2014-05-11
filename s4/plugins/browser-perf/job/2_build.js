#!/usr/bin/env node

var env = process.env;

var fs = require('fs');
var path = require('path');
var async = requireWS('async');
var browserPerf = requireWS('browser-perf');

var write = fs.writeFileSync;
var urls = env.PERF_URLS;

var output = env.BUILD_OUTPUT || 'browserperf.json';

if (!urls) throw new Error('Missing required PERF_URLS env var');
urls = urls.split(/\s+/);

if (!urls.length) throw new Error('Missing required PERF_URLS var: ' + urls);

// Go through each URL, get metrics back as an array
async.map(urls, run, function(err, results) {
  if (err) throw err;
  write(output, JSON.stringify(results, null, 2));
});


// Per url run
function run(url, done) {
  browserPerf(url, function(err, res) {
    if (err) return done(err);
    return done(null, res[0]);
  }, {
    selenium: 'ondemand.saucelabs.com',
    browsers: ['firefox'],
    username: env.SAUCE_USERNAME,
    accesskey: env.SAUCE_ACCESSKEY
  });
}

function requireWS(file, env) {
  env = env || process.env;
  return require(env.WORKSPACE ? path.join(env.WORKSPACE, 'node_modules', file) : file);
}
