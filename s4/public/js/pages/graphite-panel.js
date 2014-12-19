(function() {

  function Page(el) {
    this.el = el;
    this.$el = $(el);
    this.$ = this.$el.find.bind(this.$el);
    this.data = this.$el.data();

    this.events();
  }

  Page.prototype.events = function events() {

    var el = this.$el;
    var data = this.data;

    this.$el.on('click', '.js-img', function(e) {
      var modal = $('.js-modal');
      modal.modal();

      var width = modal.find('.modal-body').width();
      var height = modal.find('.modal-body').height();

      modal.find('.modal-body').css('text-align', 'center').empty();
      modal.find('.modal-title').text(el.data('name'));
      modal.find('.js-save').hide();

      var img = $(e.target).clone();
      var url = img.attr('src');
      url = url.replace(/width=\d+/, 'width=' + width);
      url = url.replace(/height=\d+/, 'height=' + ( height - 50 ));
      img.attr('src', url);
      modal.find('.modal-body').append(img);
    });


    this.$el.on('click', '.js-edit', function(e) {
      var dialog = new Dialog($('.js-modal'), {
        assert: data.assert,
        name: data.name
      });

      dialog.dialog();

      var url = $(e.target).closest('.js-graph').find('.js-img').attr('src');

      var width = dialog.$('.modal-body').width();
      var height = dialog.$('.modal-body').height();

      url = url.replace(/width=\d+/, 'width=' + width);
      url = url.replace(/height=\d+/, 'height=' + ( height - 150 ));

      dialog.$('.js-save').show();
      dialog.$('.js-img').attr('src', url);
    });
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
    this.$('.modal-body').empty().append(this.render());
    this.$el.modal();
  };

  Dialog.prototype.render = function render() {
    var div = $('<div class="graph-edit" />');
    var form = this.form = $('<form class="form js-form" method="POST" />');
    form.prop('action', this.options.action || '');
    var graphEl = $('<img class="graph js-img " />');

    var assert = $('<input name="assert" class="js-assert form-control" required />');
    assert.val(this.options.assert || '');
    assert.prop('placeholder', 'Assert value');

    var target = $('<input name="target" class="js-target form-control" type="hidden" />')
      .val(this.options.name)
      .appendTo(form);

    var p = $('<p class="form-group "/>')
    var label = $('<label for="assert" class="form-label"/>').text('Assert');

    assert.on('keyup', function(e) {
      var keycode = (e.keyCode ? e.keyCode : e.which) + '';
      var val = assert.val();
      var num = parseFloat(val);
      var src = graphEl.attr('src');
      var reg = /&target=constantLine\(\d+\)/;

      if (val === '') {
        p.removeClass('has-error');
        src = src.replace(reg, '')
        graphEl.attr('src', src)
        return;
      }

      if (isNaN(num)) {
        p.addClass('has-error');
        src = src.replace(reg, '')
        graphEl.attr('src', src)
        return;
      }

      p.removeClass('has-error');


      src = reg.test(src) ? src.replace(reg, '&target=constantLine(' + num + ')') :
        src + '&target=constantLine(' + num + ')';

      graphEl.attr('src', src)
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

  $(function() {
    $('.js-graph').each(function() {
      var instance = new Page(this);
      $.data(this, 'graphite', instance);
    });
  });

})();
