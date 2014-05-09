var fs   = require('fs');
var path = require('path');
var _    = require('underscore');
var util = require('util');
var debug = require('debug')('gs:jobs:base');
var Base  = require('./base');

var xml = fs.readFileSync(path.join(__dirname, 'statsd.xml'), 'utf8');

module.exports = StatsD;

function StatsD() {
  Base.apply(this, arguments);
  this.set('name', 'statsd_send');
  this.set('xml', xml);
}

util.inherits(StatsD, Base);

