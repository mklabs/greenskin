process.env.DEBUG = process.env.DEBUG || 'greenskin*';

var path       = require('path');
var debug      = require('debug')('greenskin');
var express    = require('express');
var Agenda     = require('agenda');
var agendash   = require('agendash/lib/agendash');
var exphbs     = require('express-handlebars');
var opts       = require('minimist')(process.argv.slice(2));
var bodyparser = require('body-parser');
var morgan     = require('morgan')

var middleware = require('./agendash');
var api = require('./api');

var db = 'mongodb://localhost/greenskin';

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

app.engine('.hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main'
}));

app.set('view engine', '.hbs');

// Middlewares

app.use(morgan('combined'))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/dashboard', middleware(agendash(agenda)));

// Routes

app.get('/', (req, res, next) => {
  res.render('index');
});

app.get('/create', (req, res, next) => {
  res.render('create');
});

app.post('/create', (req, res, next) => {
  var params = req.params;
  console.log(params);
  res.render('create');
});

app.get('/list', (req, res, next) => {
  res.render('list');
});

app.listen(opts.port, err => {
  if (err) throw err;
  debug('Started server on http://localhost:%d', opts.port);
});
