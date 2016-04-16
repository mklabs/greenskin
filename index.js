process.env.DEBUG = process.env.DEBUG || 'greenskin*';

var path       = require('path');
var debug      = require('debug')('greenskin');
var express    = require('express');
var Agenda     = require('agenda');
var middleware = require('./agendash');
var agendash   = require('agendash/lib/agendash');
var opts       = require('minimist')(process.argv.slice(2));

var greenskin = module.exports;

greenskin.opts = opts;

// Config

opts.port = opts.port || 3000;

// Agenda

var agenda = greenskin.agenda = new Agenda({
  db: {
    address: 'mongodb://127.0.0.1/agenda'
  }
});

agenda.define('test job', function(job, done) {
  console.log('test job', job.attrs);
  done();
});

agenda.on('ready', function() {
  agenda.every('5 minues', 'test job');
  agenda.start();
});

// Server

var app = greenskin.app = express();

app.use('/', express.static(path.join(__dirname, 'template')))

app.use('/dashboard', middleware(agendash(agenda)));

app.listen(opts.port, err => {
  if (err) throw err;
  debug('Started server on http://localhost:%d', opts.port);
});
