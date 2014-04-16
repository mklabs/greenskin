(function(doc) {

  var HView = {
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});
      this.config = this.data.config || {};

      setTimeout(this.render.bind(this), 25);

      var self = this;
      this.$el.on('dblclick', function(e) {
        e.preventDefault();
        if (screenfull.enabled) {
          screenfull.request(self.el);
        } 
      });
    },

    render: function() {
      $(this.el).highcharts({
        title: {
          text: this.data.name || ''
        },
        xAxis: {
          categories: this.config.xaxis
        },
        series: this.config.series
      });
    }
  };


  $(function() {
    var charts = $('.js-graphs')
      
    $('.js-highchart').each(function() {
        var graph = Object.create(HView);
        graph.init(this);
        
        $(this).data('graph', graph);
    });

    $('.js-fullscreen').click(function(e) {
      e.preventDefault();
      if (screenfull.enabled) {
        screenfull.request(charts[0]);
      }
    });
      
  });

})(document);
