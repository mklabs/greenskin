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
      this.poolLog();

      // Lame ... Quick & Dirty. Mostly dirty.
      this.poolMe();
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
    },

    poolLog: function() {
      if (!this.data.animated) return;
      console.log('pool log');

      var req = $.ajax({
        url: location.href
      });

      var pre = this.$el.find('.js-log');
      var self = this;
      req.success(function(res) {
        res = $(res);
        var state = res.find('.js-state')
        var log = res.find('.js-log');
        if (!log.length) return;
        var text = log.text();
        pre.html(text);
        self.ansiparse();

        if (state.text().trim() !== 'Running') {
          console.log('Changed', state.text());
          self.data.animated = false;
          self.$el.html(res.find('.js-build').html());
          self.ansiparse();
          return;
        }

        setTimeout(function() {
          self.poolLog();
        }, 2000);
      });
    },

    poolMe: function() {
      if (!this.data.last) return;

      console.log('pool me');
      var req = $.ajax({
        url: location.href
      });

      var self = this;
      req.success(function(res) {
        res = $(res);
        var number = res.find('.js-number')
        if (!number.length) return;

        var num = parseInt(number.text(), 10);

        if (num !== self.data.number) {
          console.log('Changed', num);
          self.data.number = num;
          self.data.animated = true;
          self.$el.html(res.find('.js-build').html());
          self.poolLog();
        }

        setTimeout(function() {
          self.poolMe();
        }, 5000);
      });
    }
  });


  $(function() {
    $('.js-build').each(function() {
      page.init(this);
    });
  });

})(document);
