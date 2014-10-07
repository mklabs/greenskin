(function() {

  function Page(el) {
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);

    this.pool();
  }

  Page.prototype.pool = function pool() {
    var self = this;
    console.log('Pooling result');

    var req = $.ajax({
      url: location.pathname
    });

    req.done(function(resp, status, xhr) {
      var dashboard = $(resp).find('.js-dashboard');
      self.$('.js-dashboard-wrapper').html(dashboard);

      setTimeout(function() {
        self.pool();
      }, 1000 * 30)
    });

    req.fail(function() {
      console.log('NOK');
    });
  };

  $(function() {
    $('.js-dashboard').each(function() {
      var instance = new Page(this);
      $.data(this, 'dashboard', instance);
    });
  });

})();
