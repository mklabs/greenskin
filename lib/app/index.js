var debug      = require('debug')('greenskin:server');
var path       = require('path');
var express    = require('express');
var bodyparser = require('body-parser');
var exphbs     = require('express-handlebars');
var morgan     = require('morgan');
var agendash   = require('../agenda').agendash;
var Greenskin  = require('../greenskin');
var messages   = require('express-messages');
var flash      = require('connect-flash');
var session    = require('express-session');

var app = module.exports = express();
var api = app.greenskin = new Greenskin();

var Routes = require('./routes');
var routes = new Routes(api);

// Configuration

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials'),
  layoutsDir: path.join(__dirname, 'views/layouts')
}));

app.use(session({
  secret: 'greenskin',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

// Middlewares

app.use(morgan('combined'))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, './public')))
app.use('/dashboard', agendash);

// Routes
app.get('/', routes.index.bind(routes));
app.get('/list', routes.list.bind(routes));
app.get('/create', routes.create.bind(routes));
app.post('/create', routes.createPost.bind(routes));
