
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

// Helpers


// Replaces urls predefined value in Jenkins job custom parameters, using XML job file.
//
// Returns transformed xml
helper.replaceUrlsXML = function replaceUrlsXML(xml, urls) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<name>PERF_URLS<\/name>/.test(line)) return;
    ln = i + 2;
  });

  lines[ln] = lines[ln]
    .replace(/<defaultValue>.+<\/defaultValue>/, '<defaultValue><![CDATA[' + urls.join(' ') + ']]></defaultValue>')
    .replace(/^\s*<defaultValue\/>/, '<defaultValue><![CDATA[' + urls.join(' ') + ']]></defaultValue>');

  xml = lines.join('\n');

  return xml;
};

helper.replaceTimerXML = function replaceTimerXML(xml, cron) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<hudson.triggers.TimerTrigger>/.test(line)) return;
    ln = i + 1;
  });

  lines[ln] = lines[ln].replace(/<spec>.+<\/spec>/, '<spec>' + cron.trim() + '</spec>');
  xml = lines.join('\n');

  return xml;
};

helper.replaceJSONConfig = function replaceJSONConfig(xml, json) {
  // Figure out which line
  var ln = 0;
  var lines = xml.split(/\r?\n/);
  lines.forEach(function(line, i) {
    if (!/<name>JSON_CONFIG<\/name>/.test(line)) return;
    ln = i + 2;
  });

  lines[ln] = lines[ln]
    .replace(/<defaultValue>.+<\/defaultValue>/, '<defaultValue><![CDATA[' + json + ']]></defaultValue>');
  xml = lines.join('\n');

  return xml;
};
