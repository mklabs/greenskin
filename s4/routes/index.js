var express = require('express');
var router = module.exports = express.Router();
var debug = require('debug')('gs:route');

var Jobs = require('..').Jobs;

router.get('/', function(req, res, next) {
  debug('Home route: ', req.url);
  var jobs = new Jobs();

  jobs.fetch()
    .on('error', next)
    .on('render', res.render.bind(res, 'index'));
});

