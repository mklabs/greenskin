require('./phantomjs-nodify');

var fs = require('fs');
var path = require('path');

var Parser = require('./gherkin-parser');
var Gherkin = require('gherkin').Lexer('en');

// Require & init mocha
var Mocha = require('mocha');
var mocha = new Mocha();

mocha.reporter('spec');
mocha.timeout(15000);

// Stubs for nopt
require.stub('url', function() {});
require.stub('stream', function() { return { Stream: function() {} }; });

var nopt = require('nopt')({
  stepdir: String,
  config: String,
  tmpdir: String
});

var tmpdir = nopt.tmpdir || './tmp';
var tmpfiles = [];

var files = nopt.argv.remain;
var config = {};
if (nopt.config) {
  config = require(fs.isAbsolute(nopt.config) ? nopt.config : path.join(fs.workingDirectory, nopt.config));
}

var steps = [];
var stepfiles = [];

global.Given = function Given(reg, handler) {
  reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
  steps.push({
    keyword: 'Given',
    reg: reg,
    handler: handler
  });
};

global.When = function When(reg, handler) {
  reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
  steps.push({
    keyword: 'When',
    reg: reg,
    handler: handler
  });
};

global.Then = function Then(reg, handler) {
  reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
  steps.push({
    keyword: 'Then',
    reg: reg,
    handler: handler
  });
};

// Handle stepdir, loading every .js file under this dir
if (nopt.stepdir) {
  stepfiles = fs.list(nopt.stepdir).filter(function(file) {
    if (file === '.') return false;
    if (file === '..') return false;
    return fs.isFile(path.join(nopt.stepdir, file));
  }).map(function(file) {
    return path.join(nopt.stepdir, file);
  });
}

// Handle test from config.json, writes temporary files
if (config.steps) {
  config.steps.forEach(function(step) {
    var filename = path.join(tmpdir, step.name);
    console.log('Writes %s temporary step file', filename);
    fs.write(filename, (step.body || '') + '\n');
  });

  stepfiles = config.steps.map(function(step) {
    return path.join(tmpdir, step.name);
  });

  stepfiles.forEach(function(step) {
    tmpfiles.push(step);
  });
}

if (config.features) {
  config.features.forEach(function(feature) {
    var filename = path.join(tmpdir, feature.name);
    console.log('Writes %s temporary feature file', filename);
    fs.write(filename, (feature.body || '') + '\n');
  });

  files = config.features.map(function(feature) {
    return path.join(tmpdir, feature.name);
  });

  files.forEach(function(step) {
    tmpfiles.push(step);
  });
}

stepfiles.forEach(function(file) {
  file = fs.isAbsolute(file) ? file : path.join(fs.workingDirectory, file);
  require(file);
});

// Process, scan files, translate into mocha suites
files = files.map(function(file) {
  var filename = file;
  var body = fs.read(file);

  var parser = new Parser(mocha.suite, file, steps);
  var lexer = new Gherkin(parser);
  lexer.scan(body);

  return {
    filename: filename,
    body: body,
    parser: parser
  };
});

var runner = mocha.run(function(code) {
  tmpfiles.forEach(function(file) {
    fs.remove(file);
  });

  process.exit(code);
});
