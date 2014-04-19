var env = require('system').env;
require(env.WORKSPACE ? (env.WORKSPACE + '/phantomjs-nodify') : './phantomjs-nodify');

var fs = require('fs');
var path = require('path');


var base = env.WORKSPACE ? path.join(env.WORKSPACE, 'node_modules') : path.resolve('../node_modules');
var Gherkin = require(path.join(base, 'gherkin')).Lexer('en');

// Stubs for nopt
require.stub('url', function() {});
require.stub('stream', function() { return { Stream: function() {} }; });

var nopt = require(path.join(base, 'nopt'))({
  stepdir: String,
  config: String,
  tmpdir: String,
  timeout: Number
});

var tmpdir = nopt.tmpdir || './tmp';
var tmpfiles = [];

var files = nopt.argv.remain;
var config = {};

if (nopt.config) {
  config = require(fs.isAbsolute(nopt.config) ? nopt.config : path.join(fs.workingDirectory, nopt.config));
} else if (env.JSON_CONFIG) {
  try {
    config = JSON.parse(env.JSON_CONFIG);
  } catch(e) {}
}

// Require & init mocha
var Mocha = require(path.join(base, 'mocha'));
var mocha = new Mocha();

mocha.reporter('spec');

var timeout = config.timeout ? parseInt(config.timeout, 10) : 25000;
mocha.timeout(isNaN(timeout) ? 25000 : timeout);

var Suite = Mocha.Suite;
var Test = Mocha.Test;
var utils = Mocha.utils;

// Parser

function Parser(suite, file, steps) {
    this.steps = steps || [];
    this.file = file;
    this.suite = suite;
    this.body = [''];
    this.suites = [suite];
    this.lastKeyword = 'Given';
    this.screencount = 0;
}

var events = [
    'comment',
    'tag',
    'feature',
    'background',
    'scenario',
    'scenario_outline',
    'examples',
    'step',
    'doc_string',
    'row',
    'eof'
];

events.forEach(function(ev) {
    Parser.prototype[ev] = function(keyword, token, line) {
      /* * /
      console.log(ev);
      console.log('f', keyword);
      console.log('f', token);
      console.log('f', line);
      console.log();
      /* */
    };
});

Parser.prototype.feature =
Parser.prototype.scenario =
function feature(keyword, token, line) {
  if (this.started) this.suites.shift();
  var suite = Suite.create(this.suites[0], token.trim());
  this.suites.unshift(suite);

  this.started = true;
  return suite;
};

Parser.prototype.step = function step(keyword, token, line) {
    var suites = this.suites;
    var suite = suites[0];
    var self = this;
    keyword = keyword.trim();
    
    var _keyword = keyword === 'And' ? this.lastKeyword : keyword;
    
    var step = this.steps.filter(function(step) {
        if (_keyword !== step.keyword) return;
        if (!step.reg.test(token)) return;
        return true;
    })[0];
    
    var fn = step ? step.handler : null;
    
    var matches = [];
    if (step) {
        matches = token.match(step.reg);
        if (matches) {
            matches = matches.slice(1).slice(-2);
            fn = function(done) {
              var ctx = this;
              var next = function() {
                self.screencount++;

                ctx.page.render(tmpdir + '/step-screens/step-' + self.screencount + '.png');
                done.apply(this, arguments);
              };

              step.handler.apply(this, matches.concat([next]));
            };
        }
    }
    
    if (!step) token = token + ' (Pending)';
    
    var test = new Test(_keyword + ' ' + token, fn);
    
    test.file = this.file;
    suite.addTest(test);
    
    this.lastKeyword = _keyword;
    return test;
};

Parser.prototype.add = function add(line) {
  this.body.push(line);
};

// Steps matching

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
  process.exit(code);
});