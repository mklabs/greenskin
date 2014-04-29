
var fs = require('fs');
var path = require('path');
var exists = fs.existsSync || path.existsSync;
var debug = require('debug')('sauce-browsertime:db');

module.exports = DB;

function DB(file, options) {
  debug('Init DB from %s file', file);
  // TODO: Handle non json file, node module acting as adapters to
  // various storages
  this.file = path.resolve(file);
  this.options = options || {};
  this.data = exists(this.file) ? require(this.file) : {};
  this.key = this.options['storage-key'] || Date.now();
}

DB.prototype.save = function save(results) {
  this.data[this.key] = results;
  debug(typeof results);
  debug('Process results', results);
  debug('Stored', this.data);
  this.persist();
};

DB.prototype.persist = function persist() {
  fs.writeFileSync(this.file, JSON.stringify(this.data));
};
