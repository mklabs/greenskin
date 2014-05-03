
var util = require('util');
var Model = require('./model');
var debug = require('debug')('gs:job');

module.exports = Job;

function Job() {
  Model.apply(this, arguments);
  debug('Init job', this.cid);

  this.defaults({
    name: '',
    url: '',
    color: '',
    type: ''
  });
}

util.inherits(Job, Model);

Job.prototype.save = function save(name, xml, done) {
  var me = this;
  done = done || function() {};

  var data = this.toJSON();

  name = name || data.name;
  xml = (xml || data.xml).trim();

  debug('Saving %s job', name);
  this.client.createJob(name, xml, function(err) {
    if (err) return me.error(err);
    me.emit('saved');
  });

  return this;
};
