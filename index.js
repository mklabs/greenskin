var Greenskin = require('./lib/greenskin');

var greenskin = module.exports = new Greenskin();

greenskin.server   = require('./lib/server');
greenskin.agenda   = require('./lib/agenda');
greenskin.agendash = require('./lib/agendash');
