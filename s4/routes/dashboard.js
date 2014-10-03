
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = module.exports = express.Router();
var debug = require('debug')('gs:route:dashboard');
var async = require('async');
var request = require('request');

var Jobs = require('../lib/models/jobs');

var tmpdir = path.join(__dirname, '../tmp');
var dashboardIndex = path.join(tmpdir, 'dashboard.json');

router.post('/admin/:name', function(req, res, next) {
  var body = req.body;
  var name = body.name;
  var checked = body.checked;

  fs.readFile(dashboardIndex, 'utf8', function(err, body) {
    var jobs;

    if (err) {
      jobs = {};
      if (checked === 'true') {
        jobs[name] = true;
      }

      return fs.writeFile(dashboardIndex, JSON.stringify(jobs), function(err) {
        if (err) return next(err);
        res.json({ ok: true });
      });
    }

    var json = {};

    try {
      json = JSON.parse(body);
    } catch(e) {}

    json[name] = checked === 'true' ? true : false;

    fs.writeFile(dashboardIndex, JSON.stringify(json), function(err) {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });
});

router.get('/admin', function(req, res, next) {
  var jobs = new Jobs();

  jobs.fetch()
    .on('error', next)
    .on('render', function(data) {
      buildDashboardData(data, function(err, data) {
        if (err) return next(err);
        res.render('dashboard/admin', data);
      });
    });
});

router.get('/', function(req, res, next) {
  var jobs = new Jobs();

  jobs.fetch()
    .on('error', next)
    .on('render', function(data) {
      buildDashboardData(data, function(err, data) {
        if (err) return next(err);
        res.render('dashboard/index', data);
      });
    });
});

function buildDashboardData(data, next) {
  async.map(data.jobs, function(job, done) {
    var buildjson = job.url + 'ws/build.json'
    debug('Request %s file', buildjson);

    request(buildjson, function(err, response, body) {
      if (err) return done(err);

      var data = {}, json = [];

      try {
        json = JSON.parse(body);
      } catch(e) {}

      job.data = {};

      if (!json.length) return done(null, job);

      job.data.data = json.filter(function(build) {
        return build;
      });

      // number of metrics
      job.data.numberOfMetrics = job.data.data.map(function(item) {
        return Object.keys(item.metrics).length;
      }).reduce(function(a, b) {
        return a + b;
      }, 0);

      job.data.numberOfFailedAsserts = job.data.data.map(function(item) {
        return item._asserts.failedCount;
      }).reduce(function(a, b) {
        return a + b;
      }, 0);

      job.data.availability = (100 - ((job.data.numberOfFailedAsserts * 100) / job.data.numberOfMetrics)).toFixed(2);

      done(null, job);
    });
  }, function(err, jobs) {
    if (err) return next(err);

    data.jobs = jobs;

    fs.readFile(dashboardIndex, 'utf8', function(err, body) {
      if (err) {
        data.jobs = data.jobs.map(function(job) {
          job.data.selected = false;
          return job;
        });

        return next(null, data);
      }

      var json = {};

      try {
        json = JSON.parse(body);
      } catch(e) {}

      data.jobs = data.jobs.map(function(job) {
        job.data.selected = !!json[job.name];
        return job;
      });

      next(null, data);
    });
  });
}
