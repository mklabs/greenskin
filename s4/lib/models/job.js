
var _    = require('underscore');
var util = require('util');
var debug = require('debug')('gs:models:job');
var async = require('async');
var request = require('request');

var Build = require('./build');
var Base = require('./jobs/base');
var StatsD = require('./jobs/statsd');
var Mailer = require('./jobs/mailer');
var Webdriver = require('./jobs/webdriver');

module.exports = Job;

// TODO: Flesh out relationship between Job & Build.
//
// WHen initing a job, should init a collection of builds, and init / parse
// props like lastBuild, lastSuccessfulBuild, etc.

function Job() {
  Base.apply(this, arguments);

  // Every job created gets two downstreams project to handle statsd
  // sending & asserts handling / alerting
  this.downstreams = [];
  this.downstreams.push(new StatsD());
  this.downstreams.push(new Mailer());
  this.downstreams.push(new Webdriver());
}

util.inherits(Job, Base);

// Type chekers
Job.prototype.checks = [];

// Static type checker register
Job.type = function type(name, fn) {
  debug('New job type', name);
  Job.prototype.checks.push({
    name: name,
    test: fn
  });
};

Job.prototype.toJSON = function() {
  var data = Base.prototype.toJSON.apply(this, arguments);
  // data.script = _.unescape(data.script);
  return data;
};

// Figure out the "type" of job from XML config
//
// Have to register something from subapps for that
//
// Simpler alternative would be to always generate Jobs with a GS_TYPE
// param
Job.prototype.jobType = function jobType(xml) {
  if (this.isPhantomas(xml)) return 'phantomas';

  var type = this.checks.filter(function(check) {
    // debug('Check', check.name);
    return check.test && check.test(xml);
  })[0];

  return type ? type.name : '';
};

Job.prototype.isPhantomas = function(xml) {
  if (!/PERF_URLS/.test(xml)) return;
  if (!/Phantomas JSON config/.test(xml)) return;
  return true;
};

// Namespace handling, getter / setter
Job.prototype.namespace = function(value, xml) {
  if (value) {
    this.set('namespace', value);
    this.set('type', value);
    return this;
  }

  xml = xml || this.get('xml');
  if (!xml) return;

  var type = this.jobType(xml);
  if (!type) return;

  this.set('type', type);
  this.set('namespace', type);

  return type;
};

// Config helpers, specific to backend ..
//
// TODO: Load mixin based on configured backend, below is Jenkins definitions

// Cron getter / setter

Job.prototype.setCron = function setCron(value) {
  /*jshint eqnull: true*/
  if (value == null) return this.get('cron');

  var xml = this.get('xml');
  xml = this.replaceXML(xml, value, /<hudson.triggers.TimerTrigger>/, /(<spec>).+(<\/spec>)/);

  this.set('cron', value);
  this.set('xml', xml);

  return this;
};

Job.prototype.getCron = function getCron() {
  var xml = this.get('xml');
  if (!xml) return;
  var lines = xml.split(/\r?\n/);
  var line = this.line(lines, /<hudson.triggers.TimerTrigger>/);
  var value = (lines[line].match(/<spec>(.+)<\/spec>/) || [])[1];
  if (!value) return this.warn(new Error('Cannot get cron value from XML'));

  this.set('cron', value);

  return value;
};

// URLs getter / setter

Job.prototype.getURLs = function getURLs() {
  var urls = this.param('PERF_URLS');
  if (typeof urls === 'string') urls = urls.split(/\s/);
  if (Array.isArray(urls)) {
    urls = urls.filter(function(url) {
      return url;
    });
    this.set('urls', urls);
  }
  return urls;
};

Job.prototype.setURLs = function setURLs(urls) {
  if (!urls) this.error(new Error('Missing URLs'));

  urls = urls.filter(function(url) {
    return url;
  });

  this.set('urls', urls);
  this.param('PERF_URLS', urls.join(' '));
  return this;
};

// Script getter / setter
//
// Returns the very first hudson.tasks.Shell with a shebang
//
// TODO: Better regexp matching, cache regex etc. for scripts
// TODO: Abstract away from CDATA, is it really needed ?
// TODO: Mixin external file for script handling
Job.prototype.script = function script(value) {
  if (value) {
    this.setScript(value);
    this.set('script', value);
    return this;
  }

  var code = this.getScript();
  if (code) this.set('script', code);
  return code;
};

Job.prototype.getScript = function getScript(xml) {
  xml = xml || this.get('xml');
  var lines = xml.split(/\r?\n/);
  var line = this.line(lines, /<command><!\[CDATA\[#!/, 0);
  if (!line) {
    line = this.line(lines, /<command>#!/, 0);
    if (!line) {
      debug('Err', new Error('Cannot get line shebang'));
      return;
    }
  }

  var end = this.line(lines.slice(line), /^\]\]><\/command>/, 0);
  if (!end) {
    end = this.line(lines.slice(line), /^<\/command>/, 0);
    if (!end) {
      debug('err', new Error('cannot get script end shell'));
      return;
    }
  }

  end = end + line;

  var body = lines.slice(line, end).join('\n');
  body = body
    .replace(/<command><!\[CDATA\[/, '')
    .replace(/<command>/, '')
    .replace(/<\/command>/, '')
    .replace(/\]\]>$/, '');

  return body.trim();
};

Job.prototype.setScript = function setScript(code, xml) {
  xml = xml || this.get('xml');

  var lines = xml.split(/\r?\n/);
  var line = this.line(lines, /<command>(<!\[CDATA\[)?#!/, 0);
  if (!line) return;

  var end = this.line(lines.slice(line), /^\]\]><\/command>/, 0);
  if (!end) {
    end = this.line(lines.slice(line), /^<\/command>/, 0);
    if (!end) {
      debug('err', new Error('Cannot get script end shell for saving'));
      return;
    }
  }

  end = end + line;

  var body = lines.slice(0, line);
  code = '<command><![CDATA[' + _.unescape(code.trim()) + '\n]]>';
  body = body.concat(code.split(/\r?\n/));
  body = body.concat(lines.slice(end));

  xml = body.join('\n');
  this.set('xml', xml);

  return xml;
};

// JSON config - similar to PERF_URLS, but we JSON.parse instead of .split-ing
Job.prototype.jsonConfig = function jsonConfig(value) {
  if (value) {
    this.setJSON(value);
    return this;
  }

  var json = this.param('JSON_CONFIG');
  if (!json) return this.warn(new Error('Cannot get JSON_CONFIG from xml'));

  // To avoid a bug with Jenkins always quoting objects
  if (json[0] === '"'  && json[json.length - 1] === '"') { json = json.slice(1, -1); };

  var data = {};
  try {
    data = JSON.parse(json);
  } catch(e) {
    return this.warn(new Error('Error parsing JSON from XML:\n' + json));
  }

  this.set('json', JSON.stringify(data, null, 2));
  this.set('jsonConfig', data);

  return data;
};

Job.prototype.setJSON = function setJSON(value, xml) {
  // Force output to single line
  var stored = JSON.stringify(JSON.parse(value));
  debug('Setting json value', stored);
  this.param('JSON_CONFIG', stored);
  this.set('json', value);
  return this;
};

// General param getter / setter
Job.prototype.param = function(name, value, xml) {
  xml = xml || this.get('xml');
  if (!xml) return;

  var lines = xml.split(/\r?\n/);
  var line = this.line(lines, new RegExp('<name>' + name + '</name>'), 2);
  if (!line) return;

  var regCdata = /<defaultValue><!\[CDATA\[(.+)\]\]><\/defaultValue>/;
  var reg = /<defaultValue>(.+)<\/defaultValue>/;
  var replace = '<defaultValue><![CDATA[$value]]></defaultValue>';
  var val = (lines[line].match(regCdata) || [])[1];
  if (!val) {
    val = (lines[line].match(reg) || [])[1];
    if (val) val = _.unescape(val);
  }

  debug('Param', name, val);
  if (!val) return this.warn(new Error('Cannot get ' + name + ' param value from XML'));

  // getter
  if (!value) return val;

  debug('Setting', value);
  // setter
  lines[line] = lines[line].replace(reg, replace.replace(/\$value/, value));
  debug('lines', lines[line]);
  xml = lines.join('\n');
  this.set('xml', xml);
};

// Returns the index of the first line matching `query
Job.prototype.line = function line(lines, query, offset) {
  var ln = 0;
  offset = typeof offset === 'undefined' ? 1 : offset;
  lines.forEach(function(line, i) {
    if (ln) return;
    if (!query.test(line)) return;
    ln = i + offset;
  });

  return ln;
};

Job.prototype.replaceXML = function replaceXML(xml, value, search, replace, replacer) {
  replacer = replacer || function(match, tag1, tag2) {
    return tag1 + value + tag2;
  };

  // Figure out which line
  var lines = xml.split(/\r?\n/);
  var ln = this.line(lines, search);
  lines[ln] = lines[ln].replace(replace, replacer);

  // Join back
  return lines.join('\n');
};

