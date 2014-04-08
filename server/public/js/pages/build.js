(function(doc) {

  var page = Object.create({
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.initHar();
      this.events();
    },

    events: function() {
      this.$el.on('click', '.js-har-toggle', function(e) {
        var buildBox = $(e.target).closest('.build-box');
        var harbox = buildBox.find('.js-har');
        harbox.toggle();
      });

      this.$el.on('click', '.js-timeline-toggle', function(e) {
        var buildBox = $(e.target).closest('.build-box');
        var timeline = buildBox.find('.build-url-timeline');
        timeline.toggle();
      });
    },

    initHar: function initHar() {
      var hars = this.$el.find('.js-har').HarView();

      hars.each(function() {
        var el = $(this);
        var har = el.data('HarView');
        var url = el.data('file');

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
