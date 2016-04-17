var Agenda   = require('agenda');
var agendash = require('agendash/lib/agendash');

var agenda = module.exports = new Agenda({
  db: {
    address: 'mongodb://127.0.0.1/agenda'
  }
});

agenda.agendash = require('./agendash')(agendash(agenda));

agenda.define('test job', function(job, done) {
  console.log('test job', job.attrs);
  done();
});

agenda.on('ready', function() {
  agenda.every('5 minues', 'test job');
  agenda.start();
});
