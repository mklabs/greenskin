var fs   = require('fs');
var path = require('path');
var util = require('util');
var debug = require('debug')('gs:jobs:base');
var Base  = require('./base');

var xml = fs.readFileSync(path.join(__dirname, 'mailer.xml'), 'utf8');

module.exports = Mailer;

function Mailer() {
  Base.apply(this, arguments);
  this.set('name', 'mailer');
  this.set('xml', xml);
}

util.inherits(Mailer, Base);

