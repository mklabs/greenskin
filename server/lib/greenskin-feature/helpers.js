
var debug = require('debug')('server:greenskin:feature:helper');

var fs     = require('fs');
var path   = require('path');
var spawn  = require('child_process').spawn;

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

// Phantomjs scripts
var ghmocha = require('gherkin-mocha');
var mochaRunner = ghmocha.runner.node;
var mochaSteps = [{ name: 'stepfile.js', body: '' }];
mochaSteps[0].body = fs.readFileSync(path.join(__dirname, 'stepfile.js'), 'utf8');

// Exports
var helpers = module.exports;
helpers.runFeature = runFeature;

// Helpers

function runFeature(ws, job, next) {
  var runtmpdir = job.runtmpdir;
  var screendir = path.join(runtmpdir, 'step-screens');
  var configfile = path.join(runtmpdir, 'config.json');
  var timestamp = job.timestamp;
  var data = job.data;
  var screencount = 0;

  mkdirp(screendir, function(err) {
    if (err) return next(err);

    if (!(data.steps && data.steps.length)) {
      data.steps = mochaSteps;
    }

    fs.writeFile(configfile, JSON.stringify(data, null, 2), function(err) {
      if (err) return next(err);

      var sauceEnabled = data.sauce && data.sauce.username && data.sauce.accesskey;
      var wdhost = sauceEnabled ? 'ondemand.saucelabs.com' : 'localhost';
      var wdport = sauceEnabled ? 80 : 9134;

      var args = [
        mochaRunner,
        '--config', configfile,
        '--tmpdir', path.dirname(configfile),
        '--screendir', screendir,
        '--webdriver-host', wdhost,
        '--webdriver-port', wdport
      ];

      if (sauceEnabled) {
        args.push('--webdriver-username', data.sauce.username);
        args.push('--webdriver-accesskey', data.sauce.accesskey);
        args.push('--webdriver-browser', data.sauce.browser);
      }

      process.env.DEBUG = (process.env.DEBUG || '')  + ' gherkin-mocha';
      var phantom = spawn('node', args, {
        cwd: runtmpdir
      });

      phantom.on('error', function(err) {
        next(err);
      });

      phantom.stdout.pipe(process.stdout);
      phantom.stderr.pipe(process.stderr);

      function ondata(chunk) {
        chunk = chunk + '';
        var endstep = /✓/.test(chunk.trim());
        var failstep = /\[31m\s*\d+\)/.test(chunk.trim());

        if (job.data.job) job.data.job.log(chunk);
        if (endstep || failstep) {
          screencount++;
          ws.sockets.emit('step.' + timestamp, { file: '/feature/tmp/' + timestamp + '/step-screens/step-' + screencount + '.png' });
        }
        if (ws) ws.sockets.emit('log.' + timestamp, { line: chunk });
      }

      phantom.stdout.on('data', ondata);
      phantom.stderr.on('data', ondata);

      // Bridge to phantomas and other JSON serialized RPC
      phantom.stderr.on('data', function(chunk) {
        chunk = chunk + '';

        var data = {};
        try { data = JSON.parse(chunk); }
        catch(e) {}

        if (job.data.job) job.data.job.log(chunk);

        var msg = '', filmstrip;
        if (ws && data.event) {
          msg = data.data.join(' ');
          filmstrip = (msg.match(/Film strip: rendered to ([^\s]+) in/) || [])[1];
          if (filmstrip) {
            ws.sockets.emit('step.' + timestamp, { file: '/feature/tmp/' + timestamp + '/' + filmstrip });
          }

          ws.sockets.emit('log.' + timestamp, { line: (data.event === 'log' ? '' : data.event + ' - ') + data.data.join(' ') + '\n'});
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
