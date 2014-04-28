
// Utilities to spawn a PhantomJS instance in webdriver mode
var spawn = require('child_process').spawn;

var phantom = module.exports = require('phantomjs');

// Spawns phantom in background, webdriver mode.
//
// Returns the process, invokes done on error.
phantom.webdriver = function webdriver(port, done) {
  if (!done) {
    done = port;
    port = 9134;
  }

  done = done || function() {};

  var args = ['--webdriver=' + port];
  // TODO: options to proxy over for logfile / loglevel

  var p = spawn(phantom.path, args);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);

  p.on('error', done);
  return p;
};
