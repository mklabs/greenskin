
var fs = require('fs');
var path = require('path');
var debug = require('debug')('gs:hbs');
var exists = fs.existsSync;

var hbs = module.exports = require('hbs');

var blocks = {};
var cache = {};

var partials = path.join(__dirname, '../../views/partials');
var blocksDir = path.join(__dirname, '../../views/blocks');

hbs.registerPartials(partials);
hbs.registerPartials(path.join(__dirname, '../../views'));

hbs.registerHelper('cleanUrl', function(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/g, '')
    .replace(/(\/|\?|-|&|=|\.)/g, '_');
});

hbs.registerHelper('extend', function(name, context) {
  var block = blocks[name];
  if (!block) {
    block = blocks[name] = [];
  }

  block.push(context.fn(this));
});

hbs.registerHelper('block', function(name) {
  var val = (blocks[name] || []).join('\n');

  // clear the block
  blocks[name] = [];
  return val;
});

hbs.registerHelper('tabs', function(name, context) {
  var file = cache.tabs || (cache.tabs = fs.readFileSync(path.join(partials, 'tabs.hbs'), 'utf8'));
  var template = hbs.compile(file);

  return new hbs.handlebars.SafeString(template({
    body: context.fn(this)
  }));
});

// Create a bunch of block helper for the blocks dir
fs.readdirSync(blocksDir).forEach(function(file) {
  var filename = path.join(blocksDir, file);
  var isDir = fs.statSync(filename).isDirectory();
  registerComponent(filename, isDir);
});


// Requires and register component package
function registerComponent(filename, isDir) {
  if (!isDir) return registerComponentFile(filename);

  var name = path.basename(filename);
  debug('Require component package', name);
  var component = require(filename);
  var body = component.body;

  // Validate and normalize to string
  if (!body) throw new Error('Component must provide body template string');
  if (Buffer.isBuffer(body)) body += '';

  var template = hbs.compile(body);

  var handler = component(template);
  debug('Register %s name helper');
  hbs.registerHelper(name, handler);
}

// Single file load, lookup the raw .hbs template, an optional
// associated CommonJS module to wrap things up, or defaults to the
// standard helper.
function registerComponentFile(filename) {
  var ext = path.extname(filename);
  var file = path.basename(filename);
  if (ext != '.hbs') return;

  var name = file.replace(ext, '');
  var body = cache[filename] = fs.readFileSync(filename, 'utf8');
  var template = hbs.compile(body);

  debug('Create block helper', name);

  // If the block as an associated helper, load and use it, otherwise
  // fallback to default block helper
  var helper = path.join(path.dirname(filename), name + '.js');
  var handler = exists(helper) ? require(helper)(template) : function () {
    var args = [].slice.call(arguments);
    var ctx = args.pop();
    var data = args[0] || {};
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch(e) {}
    }

    var context = {};
    context.body = ctx.fn(this).trim();
    context[name] = data;
    context.job = args[1] || {};
    return new hbs.handlebars.SafeString(template(context));
  };

  hbs.registerHelper(name, handler);
}
