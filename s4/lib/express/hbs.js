
var fs = require('fs');
var path = require('path');
var debug = require('debug')('gs:hbs');

var hbs = module.exports = require('hbs');

var blocks = {};
var cache = {};

var partials = path.join(__dirname, '../../views/partials');
var blocksDir = path.join(__dirname, '../../views/blocks');

hbs.registerPartials(partials);

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
  var ext = path.extname(file);
  if (ext != '.hbs') return;

  var name = file.replace(ext, '');
  var body = cache[filename] = fs.readFileSync(filename, 'utf8');
  var template = hbs.compile(body);

  debug('Create block helper', name);
  hbs.registerHelper(name, function() {
    var args = [].slice.call(arguments);
    var ctx = args.pop();

    debug('Render helper %s with args:', name, args);
    return new hbs.handlebars.SafeString(template({
      name: args[0],
      body: ctx.fn(this)
    }));
  });

});
