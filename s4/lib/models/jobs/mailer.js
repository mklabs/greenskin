var fs   = require('fs');
var path = require('path');
var util = require('util');
var debug = require('debug')('gs:jobs:base');
var Base  = require('./base');

var template = require.resolve('gistmailer/scripts/jenkins.xml');
var xml = fs.readFileSync(template, 'utf8');

module.exports = Mailer;

function Mailer() {
  Base.apply(this, arguments);
  this.set('name', 'mailer');
  this.set('xml', xml);
}

util.inherits(Mailer, Base);

