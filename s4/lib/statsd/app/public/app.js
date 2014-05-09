(function($, exports) {

  function Statsd(el, options) {
    this.options = options || {};
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);
    this.on = this.$el.on.bind(this.$el);

    this.init();
  }

  Statsd.prototype.init = function() {
    this.form = this.$('.js-form');
    this.input = this.$('[name=q]');
    this.metrics = this.$('.js-metrics');

    this.on('submit', '.js-form', this.submit.bind(this));
  };

  Statsd.prototype.submit = function(e) {
    e.preventDefault();
    var data = this.form.serializeArray();
    var url = location.pathname + '/s?' + data.map(function(param) {
      return param.name + '=' + encodeURIComponent(param.value);
    }).join('&');

    this.$('.js-url')
      .attr('href', url)
      .text(url);

    var me = this;
    this.request(data, function(err, data) {
      if (err) return me.error(err);
      me.render(data);
    });
  };

  Statsd.prototype.request = function request(data, done) {
    var req = $.ajax({
      url: location.pathname,
      method: 'POST',
      data: data
    });

    req.success(function(data, res) {
      done(null, data, res);
    });

    req.error(done);
    return req;
  };

  Statsd.prototype.render = function render(data) {
    var el = this.metrics;
    el.html(this.template(data));
    return this;
  };

  Statsd.prototype.error = function error(err) {
    console.error(err);
    return this;
  };

  // TODO: precompiled template
  Statsd.prototype.template = function template(data) {
    var pre = '<pre>';
    pre += JSON.stringify(data, null, 2);
    pre += '</pre>';
    return pre
  };


  $('.js-statsd').each(function() {
    var instance = new Statsd(this);
    $.data(instance, 'statsd', instance);
  });

})(this.jQuery, this);
