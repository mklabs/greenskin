(function(doc) {

  var page = Object.create({
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.initHar();
    },

    initHar: function initHar() {
      var hars = this.$el.find('.js-har').HarView();
      console.log(this.$el.find('.js-har'));
      console.log(hars);

      hars.each(function() {
        var el = $(this);
        var har = el.data('HarView');
        var url = el.data('file');

        console.log('Init har', this, url);
        $.getJSON(url, function(data, status) {
          if (status !== 'success') {
            throw new Error('XHR Error ' + data);
          }

          har.render(data);
        });
      });
    }
  });


  $(function() {
    $('.js-build').each(function() {
      page.init(this);
    });
  });

})(document);
