
var Mocha = require('mocha');
var Suite = Mocha.Suite;
var Test = Mocha.Test;
var utils = Mocha.utils;

module.exports = Parser;

function Parser(suite, file, steps) {
    this.steps = steps || [];
    this.file = file;
    this.suite = suite;
	this.body = [''];
    this.suites = [suite];
    this.lastKeyword = 'Given';
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

/**
 * Describe a "suite" with the given `title`
 * and callback `fn` containing nested suites
 * and/or tests.
 */

Parser.prototype.feature =
Parser.prototype.scenario =
function feature(keyword, token, line) {
  var suite = Suite.create(this.suites[0], token);
  this.suites.unshift(suite);
  return suite;
};

Parser.prototype.step = function step(keyword, token, line) {
    var suites = this.suites;
    var suite = suites[0];
    
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
               step.handler.apply(this, matches.concat([done]));
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
