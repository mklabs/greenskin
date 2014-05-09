var fs = require('fs');
var path = require('path');
var hbs = require('hbs');
var marked = require('marked');
var rework = require('rework');
var read = fs.readFileSync;

var ghcss = read(path.join(__dirname, 'github-markdown.css'), 'utf8');

module.exports = helper;
helper.ghcss = ghcss;
helper.body = read(path.join(__dirname, 'markdown.hbs'));

// Component "middleware".
//
// Returns the markdownHelper function to handle the block
// initialization. The helper is invoked with precompiled
// template and options hash.
function helper (template, options) {
  options = options || {};
  if (!template) throw new Error('Missing template');
  if (typeof template !== 'function') throw new Error('Template not precompiled');

  var css = rework(ghcss)
    .use(rework.prefixSelectors('.gh-markdown'))
    .toString({ compress: true })

  // Block helper for the markdown.hbs block
  return function markdownHelper() {
    var args = [].slice.call(arguments);
    var ctx = args.pop();
    var data = args[0] || {};

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch(e) {}
    }

    var context = {};
    context.raw = ctx.fn(this).trim();
    context.body = marked(context.raw);
    context.opts = context.options = data;
    context.css = css;
    return new hbs.handlebars.SafeString(template(context));
  }
};

