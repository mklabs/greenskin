(function(doc) {

  var page = Object.create({
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.initHar();
      this.events();
      this.ansiparse();
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
    },

    ansiparse: function _ansiparse() {
      var el = this.$el.find('.js-log');
      var text = el.text();
      var ansiparsed = ansiparse(text);

      var tokens = ansiparsed.map(function(token) {
        var klass = token.foreground || '';

        if (klass === 'cyan' && /Pending/.test(token.text)) {
          return '<a href="#" class="' + klass + ' js-pending">' + token.text + '</a>';
        }

        return '<span class="' + klass + '">' + token.text + '</span>';
      });

      el.html(tokens.join(''));
    }
  });


  $(function() {
    $('.js-build').each(function() {
      page.init(this);
    });
  });

})(document);
