(function(doc) {

  var View = {};
  View.init = function init(el, config) {
    this.el = el;
    this.$el = $(this.el);

    if (!this.$el.length) return;

    this.data = $.extend({}, this.$el.data(), config || {});
    this.json = this.$el.find('.js-json').html();

    this.config = JSON.parse(this.json);

    this.initChart();
  };

  View.initChart = function initChart() {
    this.profiler = new __Profiler();

    var data = this.config;
    this.profiler._getData = function() {
      var timingData = data;
      var eventNames = this._getPerfObjKeys(timingData);
      var events = {};

      var startTime = timingData.navigationStart || 0;
      var eventTime = 0;
      var totalTime = 0;

      for(var i = 0, l = eventNames.length; i < l; i++) {
        var evt = timingData[eventNames[i]];

        if (evt && evt > 0) {
          eventTime = evt - startTime;
          events[eventNames[i]] = { time: eventTime };

          if (eventTime > totalTime) {
            totalTime = eventTime;
          }
        }
      }

      this.totalTime = totalTime;

      return events;
    };

    this.profiler.init(this.el);
  };

  $(function() {
    $('.js-browsertime-metrics').each(function(e) {
      var view = Object.create(View);
      view.init(this);
      $(this).data('timingView', view);
    });

  });

})(document);
