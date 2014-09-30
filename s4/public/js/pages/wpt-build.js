(function() {

  function Page(el) {
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);

    this.events();
  }

  Page.prototype.events = function events() {
    var jsonbox = this.$('.js-json');
    var bodybox = this.$('.js-body');
    var table = this.$('.js-body .table');
    var plusbutton = this.$('.js-plus');
    var minusbutton = this.$('.js-minus');

    this.$el.on('click', '.js-jsonresult', function(e) {
      e.preventDefault();
      jsonbox.toggle();
      table.toggle();
    });

    this.$el.on('click', '.js-minus', function(e) {
      e.preventDefault();
      bodybox.hide();
      plusbutton.show();
      minusbutton.hide();
    });

    this.$el.on('click', '.js-plus', function(e) {
      e.preventDefault();
      bodybox.show();
      plusbutton.hide();
      minusbutton.show();
    });
  };

  $(function() {
    $('.js-wptbuild').each(function() {
      var instance = new Page(this);
      $.data(this, 'wptbuild', instance);
    });
  });

})();
