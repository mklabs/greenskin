var debug = require('debug')('server:feature');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var express = require('express');
var kue = require('kue');
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
  jobs.process('phantom feature', function(job, next) {
    var runtmpdir = job.data.runtmpdir;
    var configfile = path.join(runtmpdir, 'config.json');
    var timestamp = job.data.timestamp;
    var data = job.data.data;

    job.data.job = job;
    runFeature(ws, job.data, next);   
  });
}

function runFeature(ws, data, next) {
  var runtmpdir = data.runtmpdir;
  var configfile = path.join(runtmpdir, 'config.json');
  var timestamp = data.timestamp;
  var data = data.data;

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

      phantom.stdout.on('data', function(data) {
        data = data + '';
        if (data.job) job.log(data);
        if (ws) ws.sockets.emit('log.' + timestamp, { line: data });
      });

      phantom.on('exit', function(code) {
        if (code !== 0) return next(new Error('Error spawning phantomjs'));

        // TODO: Maybe delay this by 5-10 minutes or so. To let user see
        // generated stuff if any (like screenshots)
        rimraf(runtmpdir, function() {
          if (err) return next(err);
          next();
        });
      });
    });
  });
}

module.exports = function(app) {
  var featuredir = path.join(__dirname, '../test/features');
  var stepdir = path.join(__dirname, '../test/steps');
  var tmpdir = path.join(__dirname, '../tmp');

  var ws = app.ws;

  if (app.kue) createQueue(ws);

  app.get(/^\/feature\/(.+)\/?$/, function(req, res, next) {
    var filename = req.url.replace(/^\/feature\//, '');
    if (!filename) return next(new Error('Error getting feature file. No filename param.'));

    var data = {};
    data.title = 'Edit feature ' + filename;
    data.filename = filename;
    fs.readFile(path.join(featuredir, filename), 'utf8', function(err, body) {
      if (err) return next();
      data.body = body;
      data.runAction = '/run-feature/' + filename;
      data.saveAction = '/feature/' + filename;
      data.stepfile = '/steps/';
      data.stepdir = '/steps/';

      fs.readdir(stepdir, function(err, files) {
        if (err) return next(err);
        data.stepfiles = files.map(function(file) {
          return '/static/steps/' + file;
        });

        res.render('feature', data);
      });
    });
  });

  // Save
  app.post(/^\/feature\/(.+)\/?$/, function(req, res, next) {
    var filename = req.url.replace(/^\/feature\//, '');
    var params = req.body;
    var content = params.code;

    fs.writeFile(path.join(featuredir, filename), content, function(err) {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get(/^\/steps\/(.+)\/?$/, function(req, res, next) {
    var filename = req.url.replace(/^\/steps\//, '');
    if (!filename) return next(new Error('Error getting feature file. No filename param.'));

    var data = {};
    data.title = 'Edit step ' + filename;
    data.filename = filename;
    fs.readFile(path.join(stepdir, filename), 'utf8', function(err, body) {
      if (err) return next();
      data.body = body;
      data.saveAction = '/steps/' + filename;
      data.stepfile = path.join(stepdir, 'stepfile.js');
      data.stepdir = stepdir;
      data.featuredir = '/feature/';
      res.render('step', data);
    });
  });

  // Save
  app.post(/^\/steps\/(.+)\/?$/, function(req, res, next) {
    var filename = req.url.replace(/^\/steps\//, '');
    var params = req.body;
    var content = params.code;

    fs.writeFile(path.join(stepdir, filename), content, function(err) {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  // Run
  app.get(/^\/run-feature\/(.+)\/?$/, function(req, res, next) {
    var filename = req.url.replace(/^\/run-feature\//, '');
    var args = [mochaRunner, '--stepdir', stepdir, path.join(featuredir, filename)];

    var phantom = spawn(phantomjs, args);

    phantom.stdout.pipe(process.stdout);
    phantom.stderr.pipe(process.stderr);

    phantom.stdout.on('data', function(data) {
      data = data + '';
      ws.sockets.emit('log', { line: data });
    });

    phantom.on('exit', function(code) {
      if (code !== 0) return next(new Error('Error spawning phantomjs'));
      res.json({ code: code });
    });
  });

  app.use('/feature', express.directory(featuredir));
  app.use('/steps', express.directory(stepdir));
  app.use('/static/steps', express.static(stepdir));

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
