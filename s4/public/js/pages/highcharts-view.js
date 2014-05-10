(function(doc) {

  function HView(el, config) {
    this.el = el;
    this.$el = $(this.el);
    this.$ = this.$el.find.bind(this.$el);
    this.on = this.$el.on.bind(this.$el);
    this.data = $.extend({}, this.$el.data(), config || {});

    this.highchart = this.$el.find('.js-highchart');
    this.data = $.extend({}, this.data, this.highchart.data());
    this.config = this.data.config || {};
    this.config.expand = this.data.expand;


    this.on('click', '.js-edit', this.edit.bind(this));
    this.graph = new Graph(this.$('.js-highchart-graph')[0], this.config);

    // setTimeout(this.render.bind(this), 25);
    this.graph.render();
    this.graph.drawAssertLine(this.data.assert);
  }

  HView.create = function create() {
    var el = this;
    $.data(el, 'hview', new HView(el));
  };

  // Edit

  // TOOD: JST ...
  HView.prototype.edit = function edit(e) {
    e.preventDefault();
    var el = this.$('.js-highchart');
    var data = _.clone(this.config);

    data.name = this.$('.js-target').text().trim();
    data.assert = this.data.assert;
    data.action = this.data.action;
    this.dialog = new Dialog($('.js-modal'), data);
    this.dialog.dialog();
  };

  // Dialog
  function Dialog(el, options) {
    this.options = options || {};
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);
    this.on = this.$el.on.bind(this.$el);

    this.on('click', '.js-save', this.save.bind(this));
    this.on('submit', '.js-form', this.submit.bind(this));
  }

  Dialog.prototype.open = function open() {
    this.$el.modal();
  };

  Dialog.prototype.dialog = function dialog() {
    this.$('.js-body').empty().append(this.render());
    this.$el.modal();
    if (this.graph) {
      this.graph.render();
      this.graph.drawAssertLine(this.options.assert);
    }
  };

  Dialog.prototype.render = function render() {
    var div = $('<div class="graph-edit" />');
    var form = this.form = $('<form class="form js-form" method="POST" />');
    form.prop('action', this.options.action || '');
    var graphEl = $('<div class="graph " />');

    var assert = $('<input name="assert" class="js-assert form-control" required />');
    assert.val(this.options.assert || '');
    assert.prop('placeholder', 'Assert value');

    var target = $('<input name="target" class="js-target form-control" type="hidden" />')
      .val(this.options.name)
      .appendTo(form);

    var p = $('<p class="form-group "/>')
    var label = $('<label for="assert" class="form-label"/>').text('Assert');

    var graph = this.graph = new Graph(graphEl[0], this.options);

    assert.on('keyup', function(e) {
      var keycode = (e.keyCode ? e.keyCode : e.which) + '';
      var val = assert.val();
      var num = parseFloat(val);

      if (isNaN(num)) {
        p.addClass('has-error');
        return;
      }

      p.removeClass('has-error');

      graph.options.assert = num;
      graph.drawAssertLine();
    });

    p.append(label).append(assert).appendTo(form);

    div.append(form);
    div.append(graphEl);

    return div;
  };

  Dialog.prototype.save = function save(e) {
    e.preventDefault();

    if (this.$('.has-error').length) {
      e.preventDefault();
      return;
    }

    this.form.submit();
  };

  Dialog.prototype.submit = function submit(e) {
    if (this.$('.has-error').length) {
      e && e.preventDefault();
      return;
    }
  };

  // Graph
  function Graph(el, options) {
    this.options = options || {};
    this.el = el;
    this.$el = $(el);
  }

  Graph.prototype.render = function render() {
    this.chart = new Highcharts.Chart({
      chart: {
        renderTo: this.el,
        events: {
          redraw: this.drawAssertLine.bind(this)
        }
      },
      title: {
        text: this.options.name || ''
      },
      xAxis: {
        categories: this.options.xaxis
      },
      series: this.options.series
    });

    this.drawAssertLine(this.chart);
  };

  Graph.prototype.drawAssertLine = function drawAssertLine(num) {
    var chart = this.chart;

    var assert = isNaN(num) ? this.options.assert : num;
    if (!assert) return;
    if (!chart) return;

    var y = chart.yAxis[0];
    var pixel = y && y.toPixels(assert);
    var off = chart.axisOffset[3];

    // Draw horizontal line at assert level
    if (this.line) this.line.destroy();

    var line = this.line = chart.renderer.path(['M', off, pixel, 'H', chart.chartWidth])
      .attr({
        'stroke-width': 1,
        stroke: 'red',
        zIndex: 1000
      })
      .add();
  };


  $(function() {
    var charts = $('.js-graphs');

    $('.js-graph').each(HView.create);

    $('.js-fullscreen-graph').click(function(e) {
      e.preventDefault();
      if (screenfull.enabled) {
        screenfull.request(charts[0]);
      }
    });

  });

})(document);
