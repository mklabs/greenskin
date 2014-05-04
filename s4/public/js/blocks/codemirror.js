(function() {

  var codemirrors = $('.js-codemirror');


  function CodeMirrorView(el, options) {
    this.el = el;
    this.$el = $(el);
    this.options = options || {};
    this.$ = this.$el.find.bind(this.$el);
    this.on = this.$el.on.bind(this.$el);

    this.textarea();

    this.on('click', '.js-codemirror-show', this.toggleTextarea.bind(this));
  }

  CodeMirrorView.prototype.textarea = function() {
    var el = this.textarea = this.$('.js-textarea');
    var mode = el.data('mode') || this.shebang(el.val()) || 'xml';
    console.log('?mode', mode);
    var data = el.data() || {};
    if (data.codemirror) data = data.codemirror;
    data.mode = data.mode || mode;

    var editor = this.editor = CodeMirror.fromTextArea(el[0], data);
    var cm = this.cm = el.next('.CodeMirror');

    cm.addClass('form-control');
    if (data.hidden) cm.addClass('is-hidden');

    this.$el.data('editor', editor);
  };

  CodeMirrorView.prototype.toggleTextarea = function toggleTextarea(e) {
    e.preventDefault();
    if (this.cm) this.cm.toggleClass('is-hidden');
  };

  var mappings = {
    '#!/usr/bin/env node': 'javascript',
    '#!/bin/bash': 'shell'
  };

  CodeMirrorView.prototype.shebang = function shebang(code) {
    var first = code.split(/\r?\n/)[0];
    if (!first) return;
    first = first.trim();
    if (first.charAt(0) !== '#') return;
    return mappings[first.trim()];
  };


  $(function() {
    codemirrors.each(function() {
      var view = $.data(this, 'view') || new CodeMirrorView(this);
      $.data(this, 'view', view);
    });
  });

})();
