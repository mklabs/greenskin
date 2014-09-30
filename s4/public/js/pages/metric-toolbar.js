(function() {

  function Page(el) {
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);

    this.events();
  }

  Page.prototype.events = function events() {

    this.$el.on('change', '.js-target', function(e) {
      e.preventDefault();
      var value = $(this).val();
      var href = location.pathname.replace(/metrics\/?([^\/]+)?$/, 'metrics/' + value);
      location.href = href;
    });
  };

  $(function() {
    $('.js-toolbar').each(function() {
      var instance = new Page(this);
      $.data(this, 'toolbar', instance);
    });
  });

})();
