var fs   = require('fs');
var path = require('path');
var util = require('util');
var Base  = require('./base');

var xml = fs.readFileSync(path.join(__dirname, 'mailer-weekly.xml'), 'utf8');

module.exports = Mailer;

function Mailer() {
  Base.apply(this, arguments);
  this.set('name', 'mailer-weekly');
  this.set('xml', xml);
}

util.inherits(Mailer, Base);
