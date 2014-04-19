var debug = require('debug')('server:feature');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var kue = require('kue');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var config = require('../package.json').config;
var Job = require('../lib/job');

// Phantomjs script
var phantomjs = require('phantomjs').path;
var mochaRunner = path.join(__dirname, '../test/mocha-test.js');
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, '../test/mocha-stepfile.js'), 'utf8');


function createQueue(ws) {
  var jobs = kue.createQueue();

  // Job processing
  jobs.process('phantom feature', 5, function(job, next) {
    var runtmpdir = job.data.runtmpdir;
    var configfile = path.join(runtmpdir, 'config.json');
    var timestamp = job.data.timestamp;
    var data = job.data.data;

    job.data.job = job;
    runFeature(ws, job.data, next);   
  });
}

function runFeature(ws, job, next) {
  var runtmpdir = job.runtmpdir;
  var configfile = path.join(runtmpdir, 'config.json');
  var timestamp = job.timestamp;
  var data = job.data;

  mkdirp(runtmpdir, function(err) {
    if (err) return next(err);

    fs.writeFile(configfile, JSON.stringify(data, null, 2), function(err) {
      if (err) return next(err);

      var args = [mochaRunner, '--config', configfile, '--tmpdir', path.dirname(configfile)];

      var phantom = spawn(phantomjs, args, {
        cwd: runtmpdir
      });

      phantom.stdout.pipe(process.stdout);
      phantom.stderr.pipe(process.stderr);

      phantom.stdout.on('data', function(chunk) {
        chunk = chunk + '';
        if (job.data.job) job.data.job.log(chunk);
        if (ws) ws.sockets.emit('log.' + timestamp, { line: chunk });
      });

      phantom.on('exit', function(code) {
        var e = null;
        debug('Phantom exit code', code);
        if (code !== 0) e = new Error('Phantomjs exited with ' + code);

        // TODO: Maybe delay this by 5-10 minutes or so. To let user see
        // generated stuff if any (like screenshots)
        rimraf(runtmpdir, function(err) {
          if (err) return next(err);
          next(e);
        });
      });
    });
  });
}

module.exports = function(app) {
  var tmpdir = path.join(__dirname, '../tmp');

  var ws = app.ws;

  if (app.kue) createQueue(ws);

  // For step completion
  app.use('/static/feature/stepfile.js', function(req, res, next) {
    fs.createReadStream(path.join(__dirname, '../test/mocha-stepfile.js')).pipe(res);
  });

  // Job creation
  app.get('/create/feature', function(req, res, next) {
    var job = new Job('', next, {
      xmlTemplate: 'feature'
    });

    job.on('end', function(data) {
      data.title = 'Create job';
      data.action = '/api/create';
      data.runUrl = '/create/run-feature/';
      res.render('create-feature', data);
    });
  });

  app.post('/create/run-feature', function(req, res, next) {
    var params = req.body;
    var config = params.config;
    var timestamp = params.timestamp;

    var data = {};

    try {
      data = JSON.parse(config);
    } catch(e) {
      return next(e);
    }

    if (!data.steps) {
      data.steps = mochaSteps;
    }

    var runtmpdir = path.join(tmpdir, timestamp);

    var jobdata = {
      title: 'PhantomJS feature running',
      runtmpdir: runtmpdir,
      timestamp: timestamp,
      data: data
    };

    debug('Creating job %s %d', jobdata.title, jobdata.timestamp);

    if (!app.kue) return runFeature(ws, jobdata, next);

    var jobs = kue.createQueue();
    var job = jobs.create('phantom feature', jobdata).save();
    job.on('complete', function(e) {
      debug('Job complete', runtmpdir);
      next(e);
    }).on('failed', function() {
      debug('Job failed', runtmpdir);
    }).on('progress', function(progress){
      debug('\r  job #' + job.id + ' ' + progress + '% complete');
    });
  });

};
