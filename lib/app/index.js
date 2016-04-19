var fs         = require('fs');
var debug      = require('debug')('greenskin:server');
var path       = require('path');
var express    = require('express');
var bodyparser = require('body-parser');
var exphbs     = require('express-handlebars');
var morgan     = require('morgan');
var Greenskin  = require('../greenskin');
var flash      = require('connect-flash');
var session    = require('express-session');

var app = module.exports =  express();
var api = app.greenskin = new Greenskin();

// Configuration

var hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials'),
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: require('./helpers')
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'greenskin',
  resave: false,
  saveUninitialized: true
}));


// Middlewares
app.use(flash());

// app.use(morgan('combined'))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, './public')))
app.use('/dashboard', require('agendash')(api.agenda));

// Routing
//
// Routes are defined with the Routes class

var Routes = require('./routes');
var routes = new Routes(api, app);

// 404
app.use((req, res, next) => {
  fs.createReadStream(path.join(__dirname, 'public/404.html')).pipe(res);
});
