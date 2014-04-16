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
    },

    create: function(el, options) {
      var me = Object.create(HView);
      me.init(el);
      
      $(el).data('graph', me);
    }
  };

  var Graphs = {};

  Graphs.init = function(el, config) {
    this.el = el;
    this.$el = $(this.el);

    if (!this.$el.length) return;

    this.template = this.$el.find('.js-template');
    this.buttons = this.$el.find('.js-buttons');

    this.data = $.extend({}, this.$el.data(), config || {});
    this.$el.on('click', '.js-add', this.add.bind(this));

    this.$el.on('change', '.js-select-metrics', this.renderGraph.bind(this));
    this.$el.on('keyup', '.js-value', _.debounce(this.renderGraph.bind(this), 250));
    this.$el.on('click', '.js-save', _.debounce(this.save.bind(this), 250));
  };

  Graphs.add = function(e) {
      e.preventDefault();

      var tpl = $(this.template.html());
      var select = tpl.find('.js-select-metrics');
      select.select2();
      this.buttons.before(tpl);

      this.renderGraph({ target: select });

      $(e.target).remove();
  };

  Graphs.renderGraph = function(e) {
    var target = $(e.target);
    var group = target.closest('.js-row');
    var metric = group.find('.js-select-metrics').select2('val');
    var assert = group.find('.js-value').val();
    var graph = group.find('.js-highchart');

    var req = $.ajax({
      url: location.pathname + '/' + metric
    });

    req.success(function(data) {
      graph.data('name', metric);
      graph.data('config', data);
      graph.data('assert', assert);
      HView.create(graph[0]);
    });
  };

  Graphs.save = function(e) {
    e.preventDefault();

    var target = $(e.target);
    var group = target.closest('.js-row');
    var metric = group.find('.js-select-metrics').select2('val');
    var assert = group.find('.js-value').val();

    var req = $.ajax({
      method: 'POST',
      url: location.pathname + '/' + metric,
      data: {
        value: assert
      }
    });

    req.success(function(data) {
      var redirect = data.redirect;
      if (!redirect) return;
      location.replace(redirect);
    });
  };


  $(function() {
    var charts = $('.js-graphs');
      
    $('.js-highchart').each(function() {
      HView.create(this);
    });

    $('.js-graphs').each(function() {
        var graph = Object.create(Graphs);
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
