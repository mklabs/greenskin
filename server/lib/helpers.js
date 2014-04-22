
var request = require('request');
var config  = require('../package.json').config;

var helper = module.exports;

// Helper to cleanup URL for filesystem I/O or graphite keys
helper.cleanUrl = function cleanUrl(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/g, '')
    .replace(/(\/|\?|-|&|=|\.)/g, '_');
};

// Generic request wrapper to get console output from Jenkins
helper.requestJobLog = function requestJobLog(name, number, done) {
  request(config.jenkins + '/job/' + name + '/' + number + '/consoleText', done);
};
