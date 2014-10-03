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
      var target = $(this);
      var checked = target.is(':checked');
      var name = target.attr('name');

      var req = $.post('/dashboard/admin/' + name, { name: name, checked: checked });

      req.done(function() {
        console.log('OK');
      });

      req.fail(function() {
        console.log('NOK');
      });
    });
  };

  $(function() {
    $('.js-dashboard').each(function() {
      var instance = new Page(this);
      $.data(this, 'dashboard', instance);
    });
  });

})();
