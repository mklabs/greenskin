var path       = require('path');
var express    = require('express');
var bodyparser = require('body-parser');
var exphbs     = require('express-handlebars');
var morgan     = require('morgan');
var agendash   = require('./agenda').agendash;

var app = module.exports = express();

app.set('view engine', '.hbs').engine('.hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main'
}));

// Middlewares

app.use(morgan('combined'))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.use('/', express.static(path.join(__dirname, '../public')))
app.use('/dashboard', agendash);

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
