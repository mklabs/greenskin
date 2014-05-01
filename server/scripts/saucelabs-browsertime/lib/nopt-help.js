
module.exports = help;
help.Helper = Helper;

// Give it the raw typedef options passed to nopt, returns a typical usage help text.
function help(types, shorts, opts) {
  return new Helper(types, shorts, opts);
}

function Helper(types, shorts, opts) {
  this.opts = opts || {};
  this.shorts = shorts || {};
  this.types = types || {};
  this.program = this.opts.program || process.argv.slice(0, 2).join(' ');
  this.descriptions = {};

  // To let desc go through before outputting anything
  if (!this.opts.silent) process.nextTick(this.show.bind(this));
}

Helper.prototype.show = function show() {
  var output = this.help();
  if (!this.opts.silent) console.log(output);
  return this;
};

Helper.prototype.help = function help() {
  var buf = [];
  var descriptions = this.descriptions;
  var shorts = this.shorts;

  if (this._usage) {
    if (typeof this._usage === 'function') this._usage.call(this);
    else buf = buf.concat(this._usage, '');
  } else {
    buf.push('Usage: ' + this.program + ' [options]', '');
  }

  buf.push('Options:', '');
  Object.keys(this.types).forEach(function(type) {
    var flag = '--' + type;
    var shortflag = Object.keys(shorts).filter(function(key) {
      return shorts[key] === flag;
    }).map(function(key) {
      return '-' + key;
    })[0];

    var desc = descriptions[type] || '';
    shortflag = shortflag ? shortflag + ', ' : '';

    buf.push(this.pad('  ' + shortflag + flag, 25) + (desc ? ' - ' + desc : ''));
  }, this);

  return buf.join('\n');
};

Helper.prototype.desc = function desc(key, description) {
  this.descriptions[key] = description;
  return this;
};

Helper.prototype.usage = function usage() {
  var args = [].slice.call(arguments);
  this._usage = typeof args[0] === 'function' ? args[0] : args;
  return this;
};

Helper.prototype.pad = function pad(str, num) {
  if (str.length > num) return str;
  return str + new Array(num - str.length).join(' ');
};
