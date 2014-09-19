var fs   = require('fs');
var path = require('path');
var _    = require('underscore');
var util = require('util');
var debug = require('debug')('gs:jobs:base');
var Base  = require('./base');

var xml = fs.readFileSync(path.join(__dirname, 'webdriver.xml'), 'utf8');

module.exports = Webdriver;

function Webdriver() {
  Base.apply(this, arguments);
  this.set('name', 'webdriver_kill');
  this.set('xml', xml);
}

util.inherits(Webdriver, Base);

