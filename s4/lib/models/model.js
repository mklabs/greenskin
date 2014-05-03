
// Model base class

var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var config = require('../../package').config;
var debug = require('debug')('gs:model');

var Jenkins = require('../backends/jenkins');

module.exports = Model;

// Based off Backbone

// List of known instance props to exclude from serialize
var excludes = ['attributes', 'cid', 'options', '_defaults'];

// Base Model
function Model(attributes, options) {
  var attrs = attributes || {};

  this.cid = _.uniqueId('c');
  this.options = options || {};
  this._defaults = this.defaults();
  this.attributes = _.defaults({}, this._defaults, attrs);

  this.setup(config);
  this.initialize.apply(this, arguments);
}

util.inherits(Model, EventEmitter);

Model.prototype.initialize = function() {};

Model.prototype.setup = function setup(config) {
  this.backend = config.backend || 'jenkins';
  this.client = this.createClient(this.backend);
};

Model.prototype.createClient = function createClient(type) {
  debug('Create client for backend', type);
  if (type === 'jenkins') this.client = new Jenkins({ host: config.jenkins });
  if (!this.client) throw new Error('Backend ' + type + 'not implemented');
  return this.client;
};


Model.prototype.toJSON = function toJSON() {
  var me = this;
  var attr = _.clone(this.attributes);
  var data = this.keys().reduce(function(props, prop) {
    props[prop] = me[prop];
    return props;
  }, {});

  return _.extend({}, this._defaults, attr, data);
};

Model.prototype.keys = function keys() {
  return Object.keys(this).filter(function(key) {
    return !~excludes.indexOf(key);
  });
};

Model.prototype.error = function error(err) {
  err = err || new Error('Model ' + this.cid + ' raised an error');
  this.emit('error', err);
};

Model.prototype.parse = function parse(res) {
  return res;
};

Model.prototype.defaults = function defaults(defs) {
  this._defaults = _.clone(defs);
};
