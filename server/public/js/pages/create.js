(function(doc) {

  var page = Object.create({
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.codemirror();
      this.table(doc.querySelector('.js-urls'));
      this.table(doc.querySelector('.js-metrics'));

      this.cron();
      this.phantomasConfig();
      this.events();

      this.initMetricTable(doc.querySelector('.js-metrics'));
    },

    events: function() {
      var self = this;
      $('.js-form').on('submit', function(e) {
        var el = $('[name=json_config]');
        var err = self.checkJSON(el.val());
        if (err) return false;
      });
    },

    checkJSON: function(json) {
      json = json || {};
      try {
        jsonlint.parse(json);
      } catch(e) {
        return e;
      }
    },

    cron: function cron() {
      this._cron = $('.js-cron');
      var input = $('.js-cron-input');
      var span = $('.js-cron-text');

      var values = {};

      ['5', '10', '15', '20', '30', '45'].forEach(function(value) {
        values[value + ' Minutes'] = '*/' + value + ' * * * *';
      });

      var initial = this.data.cron;

      this._cron.cron({
        initial: initial || '* * * * *',

        customValues: values,
        onChange: function onChange() {
          var val = $(this).cron('value');
          input.val(val);
          span.text(val);
        }
      });
    },

    phantomasConfig: function phantomasConfig() {
      var textarea = doc.querySelector('[name=json_config]');
      if (!textarea) return;
      var cm = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        json: true,
        tabSize: 2
      });

      $('.CodeMirror').addClass('form-control');

      $(textarea).data('codemirror', cm);

      var self = this;
      cm.on('change', function(e) {
        var el = $('.js-json-error');
        var err = self.checkJSON(cm.getValue());
        if (err) {
          el
          .removeClass('is-hidden').text(err.message)
          .closest('.form-group').addClass('has-error')
          .find('.form-control').addClass('bg-danger');
        } else {
          el
          .addClass('is-hidden').text('')
          .closest('.form-group').removeClass('has-error')
          .find('.form-control').removeClass('bg-danger');

          if (!self._lock) self.initMetricTable(doc.querySelector('.js-metrics'));
          self._lock = false;
        }
      });
    },

    codemirror: function codemirror() {
      // Build codemirror instance
      var textarea = doc.querySelector('[name=xml]');
      if (!textarea) return;
      var cm = CodeMirror.fromTextArea(textarea, {
        mode: 'xml',
        tabSize: 2
      });

      $('.CodeMirror').addClass('form-control');
      $(textarea).data('codemirror', cm);

      // Bind toggle link
      var link = doc.querySelector('.js-xml-edit-toggle');
      var xmlBox = doc.querySelector('.js-xml-edit');
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var hidden = !!~xmlBox.className.indexOf('is-hidden');
        if (!hidden) {
          xmlBox.className += ' is-hidden';
        } else {
          xmlBox.className = xmlBox.className.replace(/\s?is-hidden\s?/, '');
          cm.refresh();
        }
      }, false);
    },

    metricChanged: function metricChanged(e) {
        console.log('metricChanged', e);
        var row = $(e.target).closest('tr');
        var select = row.find('.js-select-metrics');
        var value = row.find('.js-metric-value');
        var input = row.find('.js-hidden');

        var metric = select.val();
        var selected = select.find('[value="' + metric + '"]');
        var unit = row.find('.js-unit').text(selected.data('unit') || '');

        var val = parseInt(value.val(), 10);
        if (isNaN(val) || !/^\d+$/.test(value.val())) {
          val = '';
          row.addClass('has-error');
          return;
        } else {
          row.removeClass('has-error');
        }

        var metricValue = metric + ':' + val;
        input.val(metricValue);

        row[0].className = row[0].className.replace(/metric-[^\s]+/, 'metric-' + metric);

        this._lock = true;
        this.updateJSONFromMetricsTable(row);
    },

    updateJSONFromMetricsTable: function updateJSONFromMetricsTable(row) {
        // Update JSON config textarea and editor
        var metrics = row.closest('table').find('[name="metrics[]"]').serializeArray();

        metrics = metrics.filter(function(metric) {
          return metric.value;
        }).map(function(metric) {
          return metric.value.split(':');
        }).reduce(function (a, b) {
          a[b[0]] = parseInt(b[1], 10);
          return a;
        }, {});

        var cm = $('[name=json_config]').data('codemirror');
        var json = cm.getValue();

        var data = {};
        try {
          data = JSON.parse(json);
        } catch(e) {
          return;
        }

        // data.metrics = $.extend({}, data.metrics, metrics);
        data.asserts = metrics;

        json = JSON.stringify(data, null, 2);
        cm.setValue(json);
    },

    initMetricTable: function(table) {
        var cm = $('[name=json_config]').data('codemirror');
        var json = cm.getValue();
        var data = {};

        try {
          data = JSON.parse(json);
        } catch(e) {
          console.error(e);
          return;
        }

        var asserts = data.asserts || {};

        var template = table.querySelector('.js-row-template');
        var tbody = table.querySelector('tbody');
        var createRow = table.querySelector('.js-create-row');

        Object.keys(asserts).forEach(function(assert) {
          var valid = $(tbody).find('option[value="' + assert + '"]').length;

          if (!valid) return;

          var existing = $(tbody).find('.metric-' + assert);
          var tpl = existing.length ? existing[0] : template.cloneNode(true);
          tpl.className = tpl.className.replace(/is-hidden/, 'metric-' + assert);
          tpl.className = tpl.className.replace(/js-row-template/, '');

          if (!existing.length) tbody.insertBefore(tpl, createRow);

          var value = asserts[assert];
          $(tpl).find('.js-metric-value').val(value);
          $(tpl).find('.js-select-metrics').val(assert);
          $(tpl).find('.js-hidden').val(assert + ':' + value);
        }, this);

    },

    table: function table(el) {
      // URLs table
      var urlAdd = el.querySelector('.js-add');
      var tbody = el.querySelector('tbody');
      var template = el.querySelector('.js-row-template');
      var createRow = el.querySelector('.js-create-row');
      var self = this;

      $(el).on('change', '.js-select-metrics', $.proxy(this.metricChanged, this));
      $(el).on('keyup', '.js-metric-value', $.proxy(this.metricChanged, this));


      // Link for add button
      urlAdd.addEventListener('click', function(e) {
        e.preventDefault();
        var tpl = template.cloneNode(true);
        var replacement = tpl.querySelector('select') ? 'metric-DOMinserts' : '';
        tpl.className = tpl.className.replace(/is-hidden/, '');
        tpl.className = tpl.className.replace(/js-row-template/, replacement);

        tbody.insertBefore(tpl, createRow);
      }, false);

      // Click links toggle edit mode
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var target = e.target;
        if (!target) return;

        var row = target.parentElement;
        var input = row.querySelector('.js-input');

        if (target.classList.contains('js-link')) {
          target.classList.add('is-hidden');
          input.classList.remove('is-hidden');
          input.focus();
        }

        if (target.classList.contains('js-edit')) {
          row = target.parentElement.parentElement;
          target = row.querySelector('.js-link');
          input = row.querySelector('.js-input');
          target.classList.add('is-hidden');
          input.classList.remove('is-hidden');
          input.focus();
        }

        if (target.classList.contains('js-delete')) {
          row = target.parentElement.parentElement;
          tbody.removeChild(row);
          self.updateJSONFromMetricsTable($(tbody));
        }

      }, true);

      // Blur event on inputs
      el.addEventListener('blur', function(e) {
        e.preventDefault();
        var target = e.target;
        if (!target) return;

        var row = target.parentElement;
        var link = row.querySelector('.js-link');
        var hidden = row.querySelector('.js-hidden');
        if (!target.value) return;

        if (target.classList.contains('js-input')) {
          console.log('Blured!', e);
          console.log('Target', target);

          target.classList.add('is-hidden');
          link.classList.remove('is-hidden');
          link.innerText = target.value;
          hidden.value = target.value;
        }

      }, true);
    }
  });


  $(function() {
    page.init($('.js-form')[0]);
  });

})(document);
