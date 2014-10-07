
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = module.exports = express.Router();
var debug = require('debug')('gs:route:dashboard');
var async = require('async');
var request = require('request');

var Jenkins = require('../lib/backends/jenkins');

var config = require('../package.json').config;
var jenkins = new Jenkins({
  host: config.jenkins
});

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

      fs.readFile(dashboardIndex, 'utf8', function(err, body) {
        if (err) {
          data.jobs = data.jobs.filter(function(job) {
            return false;
          });

          return buildDashboardData(data, function(err, data) {
            if (err) return next(err);
            res.render('dashboard/index', data);
          });
        }

        var json = {};

        try {
          json = JSON.parse(body);
        } catch(e) {}

        data.jobs = data.jobs.filter(function(job) {
          return !!json[job.name];
        });

        buildDashboardData(data, function(err, data) {
          if (err) return next(err);
          res.render('dashboard/index', data);
        });
      });

    });
});

function buildDashboardData(data, next) {
  async.map(data.jobs, function(job, done) {

    buildJobData(job, function(err, job) {
      if (err) return next(err);

      buildBuildsData(job, function(err, job) {
        if (err) return next(err);

        buildAvailabilityDataFromFile(job, function(err, job) {
          if (err) return next(err);
          done(null, job);
        });

      });
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

function buildJobData(job, done) {
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

    if (!job.data.data.length) return done(null, job);

    // number of metrics
    job.data.numberOfMetrics = buildNumberOfMetrics(job);

    // failed asserts
    job.data.numberOfFailedAsserts = buildNumberOfFailedAsserts(job);

    // perf avg
    buildPerfAvg(job);

    // perf avg color
    var asserts = job.data.data[0].asserts;
    var assertLoadTime = asserts.domComplete || asserts.loadTime;

    job.data.assertLoadTime = assertLoadTime;

    var arrow = 'right', color = 'default';
    if (!assertLoadTime) {
      arrow = '';
      color = 'default';
    } else if (assertLoadTime > job.data.perfAvg) {
      arrow = 'down';
      color = 'success';
    } else if (assertLoadTime < job.data.perfAvg) {
      arrow = 'up';
      color = 'danger';
    } else if (assertLoadTime === job.data.perfAvg) {
      arrow = 'right';
      color = 'info';
    }

    job.data.loadTimeArrow = arrow;
    job.data.loadTimeColor = color;

    // availability
    job.data.availability = (100 - ((job.data.numberOfFailedAsserts * 100) / job.data.numberOfMetrics)).toFixed(2);
    job.data.availabilityColor = 'default';

    done(null, job);
  });
}

function buildNumberOfMetrics(job) {
  return job.data.data.filter(function(item) {
    return item.metrics;
  }).map(function(item) {
    return Object.keys(item.metrics).length;
  }).reduce(function(a, b) {
    return a + b;
  }, 0);
}

function buildNumberOfFailedAsserts(job) {
  return job.data.data.filter(function(item) {
    return (item._asserts || item.asserts);
  }).map(function(item) {
    return (item._asserts || item.asserts).failedCount;
  }).reduce(function(a, b) {
    return a + b;
  }, 0);
}

function buildPerfAvg(job) {
  var perfAvg = 0;
  if (job.data.data.length === 1) {
    perfAvg = typeof job.data.data[0].metrics.domComplete !== 'undefined' ? job.data.data[0].metrics.domComplete : job.data.data[0].metrics.loadTime;
  } else {
    perfAvg = job.data.data.map(function(item) {
      return item.metrics && (item.metrics.domComplete || item.metrics.loadTime);
    }).reduce(function(a, b) {
      return a + b;
    }, 0);
  }

  if (perfAvg === 0) job.data.perfAvg = 0;
  else job.data.perfAvg = (perfAvg / job.data.data.length).toFixed(2);
}

function buildBuildsData(job, done) {
  debug('Request job data', job.name);

  jenkins.get(job.name, function(err, data) {
    if (err) return done(err);

    var builds = data.builds;
    async.map(builds, function(build, done) {
      jenkins.build(job.name, build.number, function(err, build) {
        if (err) return done(err);
        done(null, build);
      });
    }, function(err, builds) {
      if (err) return done(err);

      var failedBuilds = builds.filter(function(build) {
        return build.result !== 'SUCCESS';
      });

      job.data.numberOfFailedBuilds = failedBuilds.length;

      done(null, job);
    });
  });
}

function buildAvailabilityDataFromFile(job, done) {
  var availabilityFile = job.url + 'ws/availabilities.json';

  request(availabilityFile, function(err, response, body) {
    if (err) return done(err);
    if (response.statusCode !== 200) return done(null, job);

    var availabilities = {};

    try {
      availabilities = JSON.parse(body);
    } catch(e) {}


    var availabilityAvg = availabilities.reduce(function(a, b) {
      return a + b;
    }, 0);

    availabilityAvg = availabilityAvg / availabilities.length;

    var arrow = 'right', color = 'default';

    if (job.data.availability > availabilityAvg) {
      arrow = 'up';
      color = 'success';
    } else if (job.data.availability < availabilityAvg) {
      arrow = 'down';
      color = 'danger';
    } else if (job.data.availability === availabilityAvg) {
      arrow = 'right';
      color = 'info';
    }

    job.data.availabilityAvg = availabilityAvg.toFixed(2);
    job.data.availabilityArrow = arrow;
    job.data.availabilityColor = color;
    done(null, job);
  });
}

function buildAvailabilityData(job, done) {
  debug('Request availability data', job.name);

  jenkins.get(job.name, function(err, data) {
    if (err) return done(err);

    var builds = data.builds;

    async.map(builds, function(build, done) {
      var fileindex = data.url + 'ws/results/' + build.number + '/files.txt';

      request(fileindex, function(err, response, body) {
        if (err) return done(err);
        if (response.statusCode !== 200) return done(null, 100);

        var files = body.split(/\r?\n/).filter(function(file) {
          return path.basename(file) === 'build.json';
        });

        async.map(files, function(file, done) {
          var buildfile = data.url + path.join('ws/results', build.number + '', file);

          request(buildfile, function(err, response, body) {
            if (err) return done(err);
            if (response.statusCode !== 200) return done();

            var json = {};

            try {
              json = JSON.parse(body);
            } catch(e) {}


            var numberOfFailedAsserts = buildNumberOfFailedAsserts({ data: { data: [ json ] } });
            var numberOfMetrics = buildNumberOfMetrics({ data: { data: [ json ] } });


            var availability = numberOfMetrics === 0 ? 100 : 100 - ((numberOfFailedAsserts * 100) / numberOfMetrics);


            done(null, availability);
          });
        }, function(err, availabilities) {
          if (err) return done(err);

          var availabilityAvg = availabilities.reduce(function(a, b) {
            return a + b;
          }, 0);

          if (availabilityAvg === 0) availabilityAvg = 0;
          else availabilityAvg = availabilityAvg / availabilities.length;

          done(null, availabilityAvg);
        });
      });

    }, function(err, availabilities) {

      var availabilityAvg = availabilities.reduce(function(a, b) {
        return a + b;
      }, 0);

      if (availabilityAvg === 0) availabilityAvg = 0;
      else availabilityAvg = availabilityAvg / availabilities.length;

      job.data.availabilityAvg = availabilityAvg;

      var arrow = 'right', color = 'default';
      if (job.data.availability > job.data.availabilityAvg) {
        arrow = 'up';
        color = 'success';
      } else if (job.data.availability < job.data.availabilityAvg) {
        arrow = 'down';
        color = 'danger';
      } else if (job.data.availability === job.data.availabilityAvg) {
        arrow = 'right';
        color = 'info';
      }

      job.data.availabilityAvg = job.data.availabilityAvg.toFixed(2);
      job.data.availabilityArrow = arrow;
      job.data.availabilityColor = color;

      done(null, job);
    });
  });
}
