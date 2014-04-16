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
      var w = this.$el.width();
      var self = this;
      var assert = this.data.assert;

      this.chart = null;
      this.$el.highcharts({
        title: {
          text: this.data.name || ''
        },
        xAxis: {
          categories: this.config.xaxis
        },
        series: this.config.series
      }, function(chart) {
        self.chart = chart;
        if (!assert) return;

        var y = chart.yAxis[0];
        var p = y && y.toPixels(assert);
        var off = chart.axisOffset[3]

        // Draw horizontal line at assert level
        chart.renderer.path(['M', off, p, 'H', chart.chartWidth])
          .attr({
            'stroke-width': 1,
            stroke: 'red',
            zIndex:1000
          })
          .add();
      });
    }
  };


  $(function() {
    var charts = $('.js-graphs');


      
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
