
var util = require('util');
var Model = require('./model');
var debug = require('debug')('gs:build');
var async = require('async');
var request = require('request');
var moment = require('moment');

module.exports = Build;

function Build() {
  Model.apply(this, arguments);
}

util.inherits(Build, Model);

Build.prototype.fetch = function fetch(done) {
  var me = this;
  done = done || function() {};

  var name = this.get('name');
  var number = this.get('number');

  async.parallel({
    job: this.client.get.bind(this.client, name),
    build: this.client.build.bind(this.client, name, number)
  }, function(err, results) {
    if (err) return me.error(err, results);
    var data = results.build;
    me.set(data);
    me.set('job', results.job);

    me.set('color', me.color());
    var m = moment(data.timestamp);
    me.set('moment', m.format('llll'));
    me.set('fromNow', m.fromNow());
    me.set('duration', moment.duration(data.duration).humanize());

    me.set('animated', /anime/i.test(data.result));

    me.emit('sync');
    done();
  });

  return this;
};

Build.prototype.color = function color() {
  var result = this.get('result');
  return result === 'SUCCESS' ? 'blue' :
    result === 'FAILURE' ? 'red' :
    result === 'WARNING' ? 'yellow' :
    '';
};
