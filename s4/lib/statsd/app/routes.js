
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var debug = require('debug')('gs:statsd:routes');

var app = require('../app');
var moment = require('moment');

var Sets = require('./sets');

module.exports = router;

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/s', query);
router.post('/', query);

function query(req, res, next) {
  var params = req.body;
  if (!params.q) params = req.query;
  debug('incoming post', params, req.body, req.query);
  var base = app.get('base');

  if (!base) return next(new Error('Missing base directory'));
  if (!params.q) return next(new Error('Missing query'));

  var sets = new Sets(path.join(base, 'sets'), {
    from: params.from || '7d',
    format: params.format
  });

  sets.load(params.q, function(err, data) {
    if (err) return next(err);
    res.send(data);
  });
};
