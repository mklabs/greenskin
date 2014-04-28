

var fs        = require('fs');
var path      = require('path');
var debug     = require('debug')('server:job');
var xml2js    = require('xml2js');
var events    = require('events');
var util      = require('util');
var phantomas = require('phantomas');

var jenkins   = require('./jenkins');
var metadata = phantomas.metadata;
var metrics = Object.keys(metadata.metrics).sort().map(function(key) {
  var metric = metadata.metrics[key];
  metric.name = key;
  return metric;
});

var templates = {
  phantomas: fs.readFileSync(path.join(__dirname, '../data', 'phantomas.xml'), 'utf8'),
  feature: fs.readFileSync(path.join(__dirname, '../data', 'feature.xml'), 'utf8')
};

module.exports = Job;

function Job(name, next, options) {
  this.options = options || {};
  this.name = name;
  this.next = next;
  this.xmlTemplate = templates[this.options.xmlTemplate || 'phantomas'];
  if (this.options.xml) {
    debug('Provided XML prop, using as raw template.');
    this.xmlTemplate = this.options.xml;
  }

  this.init();
}

util.inherits(Job, events.EventEmitter);

Job.prototype.init = function() {
  var name = this.name;
  var next = this.next;
  var self = this;

  // No name, inited from raw XML
  if (!name) {
    return process.nextTick(this.config.bind(this, null, this.xmlTemplate));
  }

  jenkins.job.get(name, function(err, job) {
    if (err) return next(err);
    self._job = job;
    jenkins.job.config(name, self.config.bind(self));
  });
};


Job.prototype.config = function(err, config) {
  var next = this.next;
  var job = this._job || {};
  var self = this;

  if (err) return next(err);
  job.xml = config;

  xml2js.parseString(config, function(err, result) {
    if (err) return next(err);

    // Figure out the URLs in XML file
    var params = ((result.project.properties || [])[0] || {})['hudson.model.ParametersDefinitionProperty'];

    params = params &&
      params[0] &&
      params[0].parameterDefinitions &&
      params[0].parameterDefinitions[0] &&
      params[0].parameterDefinitions[0]['hudson.model.StringParameterDefinition'];

    var urls = [];
    if (params) {
      urls = params.filter(function(param) {
        return param.name[0] === 'PERF_URLS';
      }).map(function(param) {
        return param.defaultValue[0].split(' ');
      })[0];
    }

    // As well as the cron frequency
    var timer = result.project.triggers.filter(function(trigger) {
      return trigger['hudson.triggers.TimerTrigger'];
    })[0];

    var cron = '';
    if (timer) {
      cron = timer['hudson.triggers.TimerTrigger'][0].spec[0];
    }

    // As well as the phantomas config in JSON_CONFIG
    var jsonconfig = params.filter(function(param) {
        return param.name[0] === 'JSON_CONFIG';
      }).map(function(param) {
        var data = {};
        try {
          data = JSON.parse(param.defaultValue[0]);
        } catch(e) {
          console.error(e);
        }

        return data;
      })[0];

    job.urls = urls || [];
    job.config = jsonconfig;
    job.json = JSON.stringify(jsonconfig, null, 2);

    job.type = 'phantomas';
    job.namespace = 'p';
    if (job.config && job.config.features) {
      job.type = 'feature';
      job.namespace = 'feature';
    }

    var phantomas = {};
    phantomas.metrics = metrics.concat();

    if (job.type === 'phantomas') {
      job.phantomas = true;
    } else if (job.type === 'feature') {
      job.feature = true;
    }

    // TODO: Find a way to do that matching from subapps
    if (job.config && job.config.type === 'browsertime') {
      job.type = 'browsertime';
      job.namespace = 'bt';
      job.browsertime = true;
      job.phantomas = true;
      job.feature = false;
    }

    job.red = job.color === 'red' || job.color === 'yellow';

    self.emit('end', {
      job: job,
      cron: cron,
      phantomas: phantomas
    });

  });

};
