var fs   = require('fs');
var path = require('path');
var util = require('util');
var Base  = require('./base');
var config = require('../../../package.json').config;

var xml = fs.readFileSync(path.join(__dirname, 'mailer.xml'), 'utf8');
xml = xml.replace('{{ mails }}', config.mails);
xml = xml.replace('{{ mailUser }}', config.mailUser);
xml = xml.replace('{{ mailHost }}', config.mailHost);

module.exports = Mailer;

function Mailer() {
  Base.apply(this, arguments);
  this.set('name', 'mailer');
  this.set('xml', xml);
}

util.inherits(Mailer, Base);
