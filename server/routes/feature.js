var debug = require('debug')('server:feature');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var kue = require('kue');
var express = require('express');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var config = require('../package.json').config;
var Job = require('../lib/job');

// Phantomjs script
var phantomjs = require('phantomjs').path;
var mochaRunner = path.join(__dirname, '../test/mocha-test.js');
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, '../test/mocha-stepfile.js'), 'utf8');


// Helpers

function createQueue(ws) {
  var jobs = kue.createQueue();

  // Job processing
  debug('Creating kue processing for phantom feature');
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
  var screendir = path.join(runtmpdir, 'step-screens');
  var configfile = path.join(runtmpdir, 'config.json');
  var timestamp = job.timestamp;
  var data = job.data;
  var screencount = 0;

  mkdirp(screendir, function(err) {
    if (err) return next(err);

    fs.writeFile(configfile, JSON.stringify(data, null, 2), function(err) {
      if (err) return next(err);

      var args = [mochaRunner, '--config', configfile, '--tmpdir', path.dirname(configfile)];

      var phantom = spawn(phantomjs, args, {
        cwd: runtmpdir
      });

      phantom.stdout.pipe(process.stdout);
      // phantom.stderr.pipe(process.stderr);

      phantom.stderr.on('data', function(chunk) {
        chunk = chunk + '';

        var data = {};
        try { data = JSON.parse(chunk); }
        catch(e) {}

        if (job.data.job) job.data.job.log(chunk);

        if (!data.event) console.log(chunk);

        var msg = '', filmstrip;
        if (ws && data.event) {
          msg = data.data.join(' ');
          filmstrip = (msg.match(/Film strip: rendered to ([^\s]+) in/) || [])[1];
          if (filmstrip) {
            ws.sockets.emit('step.' + timestamp, { file: '/f/tmp/' + timestamp + '/' + filmstrip });
          }

          ws.sockets.emit('log.' + timestamp, { line: (data.event === 'log' ? '' : data.event + ' - ') + data.data.join(' ') + '\n'});
        }
      });

      phantom.stdout.on('data', function(chunk) {
        chunk = chunk + '';
        var endstep = /✓/.test(chunk.trim());
        var failstep = /\[31m\s*\d+\)/.test(chunk.trim());

        if (job.data.job) job.data.job.log(chunk);
        if (endstep || failstep) {
          screencount++;
          ws.sockets.emit('step.' + timestamp, { file: '/f/tmp/' + timestamp + '/step-screens/step-' + screencount + '.png' });
        }
        if (ws) ws.sockets.emit('log.' + timestamp, { line: chunk });
      });

      phantom.on('exit', function(code) {
        var e = null;
        debug('Phantom exit code', code);
        if (code !== 0) e = new Error('Phantomjs exited with ' + code);

        // TODO: Maybe delay this by 5-10 minutes or so. To let user see
        // generated stuff if any (like screenshots)
        debug('Will rimraf %s in %d seconds', runtmpdir, 30);
        fs.readdir(screendir, function(err, files) {
          if (err) return next(err);
          next(null, data);
        });

        setTimeout(function() {
          debug('Rimrafing %s', runtmpdir);
          rimraf(runtmpdir, function(err) {
            if (err) console.error(err);
            debug('Rimrafed %s OK', runtmpdir);
          });
        }, 1000 * 30);

      });
    });
  });
}

// Routes

module.exports = function(app) {
  var tmpdir = path.join(__dirname, '../tmp');

  var ws = app.ws;

  debug('Init feature subapp', app.kue);
  if (app.kue) createQueue(ws);

  // For browsing temporary workspaces
  app.use('/f/tmp', express.static(tmpdir));
  app.use('/f/tmp', express.directory(tmpdir));

  // Job creation
  app.get('/f/create', function(req, res, next) {
    var job = new Job('', next, {
      xmlTemplate: 'feature'
    });

    job.on('end', function(data) {
      data.title = 'Create job';
      data.action = '/api/create';
      data.runUrl = '/f/create/run-feature/';
      data.job.json = JSON.stringify(data.job.config);
      res.render('create-feature', data);
    });
  });

  app.post('/f/create/run-feature', function(req, res, next) {
    var params = req.body;
    var config = params.config;
    var timestamp = params.timestamp;

    var data = {};

    try {
      data = JSON.parse(config);
    } catch(e) {
      return next(e);
    }

    // normalize feature name, adding .feature extension if missing
    data.features = data.features.map(function(f) {
      f.name = path.extname(f.name) !== '.feature' ? f.name + '.feature' : f.name;
      return f;
    });

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

    if (!app.kue) return runFeature(ws, jobdata, function(err, data) {
      if (err) return next(err);
      res.json(data);
    });

    var jobs = kue.createQueue();
    var job = jobs.create('phantom feature', jobdata).save();

    debug('Kue process %s %d', jobdata.title, jobdata.timestamp);
    job.on('complete', function(e) {
      debug('Job complete', runtmpdir);
      if (e) return next(e);
        fs.readdir(path.join(runtmpdir, 'step-screens'), function(err, files) {
          if (err) return next(err);
          res.json({
            timestamp: timestamp,
            workspace: '/f/tmp/' + timestamp,
            screens: files
          });
        });
    }).on('failed', function() {
      debug('Job failed', runtmpdir);
    }).on('progress', function(progress){
      debug('\r  job #' + job.id + ' ' + progress + '% complete');
    });
  });

};
