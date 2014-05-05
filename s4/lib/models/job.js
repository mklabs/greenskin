
var _    = require('underscore');
var util = require('util');
var debug = require('debug')('gs:job');
var async = require('async');
var request = require('request');

var Model = require('./model');
var Build = require('./build');

module.exports = Job;

// TODO: Flesh out relationship between Job & Build.
//
// WHen initing a job, should init a collection of builds, and init / parse
// props like lastBuild, lastSuccessfulBuild, etc.

function Job() {
  Model.apply(this, arguments);

  this.defaults({
    name: '',
    url: '',
    color: '',
    type: ''
  });

  var xml = this.get('xml');
  if (xml) this.getCron();
  if (xml) this.getURLs();
  if (xml) this.namespace();
  if (xml) this.jsonConfig();
}

util.inherits(Job, Model);

Job.prototype.save = function save(name, xml, done) {
  var me = this;
  done = done || function() {};

  var data = this.toJSON();

  name = name || data.name;
  xml = (xml || data.xml).trim();

  debug('Saving %s job', name);
  var client = this.client;
  client.exists(name, function(err, exists) {
    if (err) return me.error(err);
    client[exists ? 'config' : 'create'](name, xml, function(err) {
      if (err) return me.error(err);
      me.emit('saved');
      done();
    });
  });

  return this;
};

Job.prototype.fetch = function fetch(done) {
  var me = this;
  done = done || function() {};

  var name = this.get('name');

  async.parallel({
    job: this.client.get.bind(this.client, name),
    xml: this.client.config.bind(this.client, name)
  }, function(err, results) {
    if (err) return me.error(err, results);
    me.set(results.job);
    me.set('xml', results.xml);

    me.namespace();
    me.getCron();
    me.getURLs();
    me.script();
    me.jsonConfig();

    // Request build infos ? Configurable through opts ?
    var props = ['lastBuild', 'lastFailedBuild', 'lastCompletedBuild', 'lastUnstableBuild', 'lastUnsuccessfulBuild', 'lastSuccessfulBuild'];

    async.each(props, function(prop, done) {
      var info = me.get(prop);
      if (!info) return done();

      var build = new Build({
        name: me.name,
        number: info.number
      });

      build.on('error', done);
      build.on('sync', function() {
        me.set(prop, build.toJSON());
        done();
      });

      build.fetch();
    }, function(err) {
      if (err) return me.error(err, results);
      me.emit('sync');
      done();
    });
  });

  return this;
};

Job.prototype.destroy = function destroy() {
  var name = this.name;
  var me = this;
  this.client.delete(name, function(err) {
    if (err) return me.error(err);
    me.emit('destroyed');
  });
  return this;
};

Job.prototype.run = function run() {
  if (!this.name) return;
  var me = this;

  var url = this.client.host + '/job/' + this.name + '/buildWithParameters';
  debug('Run url:', url);
  request(url, function(err) {
    if (err) return next(err);
    me.emit('run');
  });

  return this;
};

Job.prototype.toJSON = function() {
  var data = Model.prototype.toJSON.apply(this, arguments);
  return data;
};

// Figure out the "type" of job from XML config
Job.prototype.jobType = function jobType(xml) {
  var type = /phantomas/.test(xml) ? 'phantomas' :
    '';
  return type;
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

  var end = this.line(lines.slice(line), /^\]\]>/, 0);
  if (!end) {
    end = this.line(lines.slice(line), /<\/command>/, 0);
    if (!end) {
      debug('Err', new Error('Cannot get script end shell'));
      return;
    }
  }

  end = end + line;

  var body = lines.slice(line, end).join('\n');
  body = body
    .replace(/<command><!\[CDATA\[/, '')
    .replace(/<command>/, '')
    .replace(/<\/command>/, '');

  return _.unescape(body.trim());
};

Job.prototype.setScript = function setScript(code, xml) {
  xml = xml || this.get('xml');
  var lines = xml.split(/\r?\n/);
  var line = this.line(lines, /<command><!\[CDATA\[#!/, 0);
  if (!line) return;

  var end = this.line(lines.slice(line), /^\]\]>/, 0) + line;
  if (!end) return;

  var body = lines.slice(0, line);
  code = '<command><![CDATA[' + code.trim();
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
  try {
    // Force output to single line
    value = JSON.stringify(JSON.parse(value));
  } catch(e) {}

  this.param('JSON_CONFIG', value);
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

  var reg = /<defaultValue><!\[CDATA\[(.+)\]\]><\/defaultValue>/;
  var replace = '<defaultValue><![CDATA[$value]]></defaultValue>';
  var val = (lines[line].match(reg) || [])[1];
  if (!val) {
    val = (lines[line].match(/<defaultValue>(.+)<\/defaultValue>/) || [])[1];
    if (val) val = _.unescape(val);
  }

  if (!val) return this.warn(new Error('Cannot get ' + name + ' param value from XML'));

  // getter
  if (!value) return val;

  // setter
  lines[line] = lines[line].replace(reg, replace.replace(/\$value/, value));
  xml = lines.join('\n');
  this.set('xml', xml);
};

// Returns the index of the first line matching `query
Job.prototype.line = function line(lines, query, offset) {
  var ln = 0;
  offset = typeof offset === 'undefined' ? 1 : offset;
  lines.forEach(function(line, i) {
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
