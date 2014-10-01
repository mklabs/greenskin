
var _       = require('underscore');
var util    = require('util');
var debug   = require('debug')('gs:models:base');
var async   = require('async');
var request = require('request');
var Model   = require('../model');
var Build   = require('../build');

module.exports = Base;

function Base() {
  Model.apply(this, arguments);

  this.defaults({
    name: '',
    url: '',
    color: '',
    type: ''
  });

  var xml = this.get('xml');
  if (xml) this.script();
  if (xml) this.getCron();
  if (xml) this.getURLs();
  if (xml) this.namespace();
  if (xml) this.jsonConfig();
}

util.inherits(Base, Model);

Base.prototype.save = function save(name, xml, done) {
  var me = this;
  done = done || function() {};

  var data = this.toJSON();

  name = name || data.name;
  xml = (xml || data.xml).trim();

  debug('Saving %s job', name);
  var client = this.client;

  this.saveDownstreams(function(err) {
    if (err) return me.error(err);
    client.exists(name, function(err, exists) {
      if (err) return me.error(err);
      client[exists ? 'config' : 'create'](name, xml, function(err) {
        if (err) return me.error(err);
        me.emit('saved');
        done();
      });
    });
  });

  return this;
};

Base.prototype.saveDownstreams = function saveDownstreams(done) {
  this.downstreams = this.downstreams || [];

  var client = this.client;
  async.each(this.downstreams, function(downstream, next) {
    debug('Saving downstream job', downstream.name);
    var name = downstream.name;
    var xml = downstream.get('xml');

    client.exists(name, function(err, exists) {
      if (err) return me.error(err);
      if (exists) return next();
      client.create(name, xml, next);
    });
  }, done);

};

Base.prototype.fetch = function fetch(done) {
  var me = this;
  done = done || function() {};

  var name = this.get('name');
  async.parallel({
    job: this.client.get.bind(this.client, name),
    xml: this.client.config.bind(this.client, name)
  }, function(err, results) {
    if (err) return me.error(err);
    me.set(results.job);
    me.set('xml', results.xml);

    if (me.namespace) me.namespace();
    if (me.getCron) me.getCron();
    if (me.getURLs) me.getURLs();
    if (me.script) me.script();
    if (me.jsonConfig) me.jsonConfig();

    me.fetchBuilds(done);
  });

  return this;
};

Base.prototype.fetchBuilds = function fetchBuilds(done) {
  // Request build infos ? Configurable through opts ?
  var props = [
    'lastBuild',
    'lastFailedBuild',
    'lastCompletedBuild',
    'lastUnstableBuild',
    'lastUnsuccessfulBuild',
    'lastSuccessfulBuild'
  ];

  var me = this;
  async.each(props, function(prop, next) {
    var info = me.get(prop);
    if (!info) return next();

    var build = new Build({
      name: me.name,
      number: info.number
    });

    build.on('error', next);
    build.on('sync', function() {
      me.set(prop, build.toJSON());
      next();
    });

    build.fetch();
  }, function(err) {
    if (err) return me.error(err);
    me.emit('sync');
    done();
  });
};

Base.prototype.destroy = function destroy() {
  var name = this.name;
  var me = this;
  this.client.delete(name, function(err) {
    if (err) return me.error(err);
    me.emit('destroyed');
  });
  return this;
};

Base.prototype.run = function run() {
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
