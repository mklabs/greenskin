var fs   = require('fs');
var path = require('path');
var util = require('util');
var Base  = require('./base');

var xml = fs.readFileSync(path.join(__dirname, 'cleanup-workspace.xml'), 'utf8');

module.exports = CleanupWorkspace;

function CleanupWorkspace() {
  Base.apply(this, arguments);
  this.set('name', 'cleanup-workspace');
  this.set('xml', xml);
}

util.inherits(CleanupWorkspace, Base);
