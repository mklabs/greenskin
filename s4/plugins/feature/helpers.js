var debug = require('debug')('server:feature-helper');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

// Phantomjs script
var phantomjs = require('phantomjs').path;
var ghmocha = require('gherkin-mocha');

var mochaRunner = ghmocha.runner.phantom;
var webdriverRunner = ghmocha.runner.node;
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, 'mocha-webdriver-stepfile.js'), 'utf8');

// Exports
var helpers = module.exports;
helpers.runFeature = runFeature;
helpers.runWebdriverFeature = runWebdriverFeature;

// Helpers
function runWebdriverFeature(ws, job, next) {
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

      var args = [webdriverRunner, '--config', configfile, '--tmpdir', path.dirname(configfile), '--screendir', screendir];
      // var args = [webdriverRunner, '--config', configfile, '--tmpdir', path.dirname(configfile)];

      var phantom = spawn('node', args, {
        cwd: runtmpdir
      });

      phantom.stdout.pipe(process.stdout);
      phantom.stderr.pipe(process.stderr);

      phantom.stderr.on('data', function(chunk) {
        chunk = chunk + '';

        var data = {};
        try { data = JSON.parse(chunk); }
        catch(e) {}

        if (job.data.job) job.data.job.log(chunk);

        if (!data.event) {
          // console.log(chunk);
          ws.emit('log.' + timestamp, { line: chunk});
        }

        var msg = '', filmstrip;
        if (ws && data.event) {
          msg = data.data.join(' ');
          filmstrip = (msg.match(/Film strip: rendered to ([^\s]+) in/) || [])[1];
          if (filmstrip) {
            ws.emit('step.' + timestamp, { file: '/f/tmp/' + timestamp + '/' + filmstrip });
          }

          // console.log('STDERR', chunk, 'ENDCHUNK');
          ws.emit('log.' + timestamp, { line: (data.event === 'log' ? '' : data.event + ' - ') + data.data.join(' ') + '\n'});
        }
      });

      phantom.stdout.on('data', function(chunk) {
        chunk = chunk + '';
        var endstep = /✓/.test(chunk.trim());
        var failstep = /\[31m\s*\d+\)/.test(chunk.trim());

        if (job.data.job) job.data.job.log(chunk);
        if (endstep || failstep) {
          screencount++;
          ws.emit('step.' + timestamp, { file: '/feature/tmp/' + timestamp + '/step-screens/step-' + screencount + '.png' });
        }

        if (ws) {
          // console.log('STDOUT', chunk, 'ENDCHUNK');
          ws.emit('log.' + timestamp, { line: chunk });
        }
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

      var args = [mochaRunner, '--config', configfile, '--tmpdir', path.dirname(configfile), '--screendir', screendir];

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
