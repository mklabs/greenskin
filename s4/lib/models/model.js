
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
var excludes = ['attributes', 'cid', 'options', '_defaults', 'backend', 'client'];

// Base Model
function Model(attributes, options) {
  var attrs = attributes || {};

  this.cid = _.uniqueId('c');
  this.options = options || {};
  this._defaults = this.defaults();
  this.attributes = _.defaults({}, this._defaults, attrs);
  // debug('Init model', this.cid, this.keys());

  this.setup(config);
  this.initialize.apply(this, arguments);
}

util.inherits(Model, EventEmitter);

Model.prototype.initialize = function() {};

Model.prototype.setup = function setup(config) {
  this.backend = config.backend || 'jenkins';
  this.client = this.createClient(this.backend);
};

// client singleton

var client = new Jenkins({ host: config.jenkins });

Model.prototype.createClient = function createClient(type) {
  // if (type === 'jenkins') this.client = new Jenkins({ host: config.jenkins });
  if (!this.client) this.client = client;
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

Model.prototype.warn = function warn(err) {
  err = err || new Error('Model ' + this.cid + ' raised an error');
  debug('Model error: %s', err.message, err);
};

Model.prototype.parse = function parse(res) {
  return res;
};

// Default, ensure default value in serialization and define convenience
// accessor for these props
Model.prototype.defaults = function defaults(defs) {
  this._defaults = _.clone(defs || {});

  var self = this;
  Object.keys(this._defaults).forEach(function(def) {
    Object.defineProperty(this, def, {
      get: function() {
        return self.get(def);
      }
    });
  }, this);
};

Model.prototype.get = function get(name) {
  return this.attributes[name];
};

Model.prototype.set = function set(key, val, options) {
  var attrs;
  var current = this.attributes;
  if (key == null) return this;

  // Handle both `"key", value` and `{key: value}` -style arguments.
  if (typeof key === 'object') {
    attrs = key;
    options = val;
  } else {
    (attrs = {})[key] = val;
  }

  options || (options = {});

  // For each `set` attribute, update or delete the current value.
  Object.keys(attrs).forEach(function(attr) {
    var val = attrs[attr];
    current[attr] = val;
  });

  return this;
};
