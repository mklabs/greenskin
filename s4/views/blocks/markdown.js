var hbs = require('hbs');
var marked = require('marked');

module.exports = function(template, options) {
  options = options || {};
  if (!template) throw new Error('Missing template');
  if (typeof template !== 'function') throw new Error('Template not precompiled');

  // Block helper for the markdown.hbs block
  return function markdownHelper() {
    var args = [].slice.call(arguments);
    var ctx = args.pop();
    var data = args[0] || {};

    var context = {};
    context.raw = ctx.fn(this).trim();
    context.body = marked(context.raw);
    return new hbs.handlebars.SafeString(template(context));
  }
};

