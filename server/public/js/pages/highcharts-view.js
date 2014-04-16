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
      this.chart = new Highcharts.Chart({
        chart: {
          renderTo: this.el,
          events: {
            redraw: this.drawAssertLine.bind(this)
          }
        },
        title: {
          text: this.data.name || ''
        },
        xAxis: {
          categories: this.config.xaxis
        },
        series: this.config.series
      });

      this.drawAssertLine(this.chart);
    },

    drawAssertLine: function(c) {
        var chart = c instanceof Highcharts.Chart ? c : this.chart;
        
        var assert = this.data.assert;
        if (!assert) return;
        if (!chart) return;

        var y = chart.yAxis[0];
        var pixel = y && y.toPixels(assert);
        var off = chart.axisOffset[3]

        // Draw horizontal line at assert level

        if (this.line) this.line.destroy();

        var line = this.line = chart.renderer.path(['M', off, pixel, 'H', chart.chartWidth])
          .attr({
            'stroke-width': 1,
            stroke: 'red',
            zIndex: 1000
          })
          .add();
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
