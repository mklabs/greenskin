(function() {

  var textareas = $('.js-codemirror');

  textareas.each(function() {
    var el = $(this);
    var mode = el.data('mode') || 'xml';
    var data = el.data();
    if (data.codemirror) data = data.codemirror;
    data.mode = data.mode || mode;
    var editor = CodeMirror.fromTextArea(this, data);
    el.next('.CodeMirror').addClass('form-control');
    el.data('editor', editor);
  });

})();
