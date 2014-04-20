
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var express = require('express');

// Phantomjs script
var phantomjs = require('phantomjs').path;
var mochaSteps = [{ name: 'stepfile.js', body: '' }];

var mochaRunner = path.join(__dirname, '../../test/mocha-test.js');
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, '../../test/mocha-stepfile.js'), 'utf8');

var app = module.exports = express();

var featuredir = path.join(__dirname, '../../test/features');
var stepdir = path.join(__dirname, '../../test/steps');
var tmpdir = path.join(__dirname, '../../tmp');

// GET feature
app.get(/^\/(.+)\/?$/, function(req, res, next) {
  var filename = req.url.replace(/^\/feature\//, '');
  if (!filename) return next(new Error('Error getting feature file. No filename param.'));

  var prefix = req.originalUrl.replace(req.url, '');

  var data = {};
  data.title = 'Edit feature ' + filename;
  data.filename = filename;
  fs.readFile(path.join(featuredir, filename), 'utf8', function(err, body) {
    if (err) return next();
    data.body = body;
    data.runAction = prefix + '/run-feature/' + filename;
    data.saveAction = prefix + '/feature/' + filename;
    data.stepfile = prefix + '/steps/';
    data.stepdir = prefix +  '/steps/';

    fs.readdir(stepdir, function(err, files) {
      if (err) return next(err);
      data.stepfiles = files.map(function(file) {
        return prefix + '/static/steps/' + file;
      });

      res.render('feature', data);
    });
  });
});

// GET /step
app.get(/^\/steps\/(.+)\/?$/, function(req, res, next) {
  var filename = req.url.replace(/^\/steps\//, '');
  if (!filename) return next(new Error('Error getting feature file. No filename param.'));

  var prefix = req.originalUrl.replace(req.url, '');

  var data = {};
  data.title = 'Edit step ' + filename;
  data.filename = filename;
  fs.readFile(path.join(stepdir, filename), 'utf8', function(err, body) {
    if (err) return next();
    data.body = body;
    data.saveAction = prefix + '/steps/' + filename;
    data.stepfile = path.join(stepdir, 'stepfile.js');
    data.stepdir = stepdir;
    data.featuredir = prefix + '/';
    res.render('step', data);
  });
});


// Save
app.post(/^\/steps\/(.+)\/?$/, function(req, res, next) {
  console.log('POST', req.url);
  var filename = req.url.replace(/^\/steps\//, '');
  var params = req.body;
  var content = params.code;

  fs.writeFile(path.join(stepdir, filename), content, function(err) {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

// Save Feature
app.post(/^\/(.+)\/?$/, function(req, res, next) {
  console.log('wait what?', req.url);
  var filename = req.url.replace(/^\/feature\//, '');
  var params = req.body;
  var content = params.code;

  fs.writeFile(path.join(featuredir, filename), content, function(err) {
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
    if (app.parent && app.parent.ws) app.parent.ws.sockets.emit('log', { line: data });
  });

  phantom.on('exit', function(code) {
    if (code !== 0) return next(new Error('Error spawning phantomjs'));
    res.json({ code: code });
  });
});


app.use('/', express.directory(featuredir));
app.use('/steps', express.directory(stepdir));
app.use('/static/steps', express.static(stepdir));