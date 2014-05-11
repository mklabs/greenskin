
var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');

var debug = require('debug')('gs:browserperf');

var app = module.exports = express();

var routes = require('./routes');

var ns = path.basename(__dirname);

app.on('mount', function(gs) {
  debug('Browserperf app mounted, setting gs instance', ns);
  app.gs = gs;
  // Attach here any initialization logic
  gs.locals.buttons.push({
    name: 'Create Job (browserperf)',
    url: '/' + ns + '/create'
  });

  app.gs.Job.type('browserperf', function(xml) {
    if (!/PERF_URLS/.test(xml)) return;
    if (!/Browserperf JSON config/.test(xml)) return;
    return true;
  });

  // debug('Initing partial dir');
  // gs.hbs.registerPartials(path.join(__dirname, 'views/partials'));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
