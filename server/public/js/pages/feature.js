(function(doc) {

  var page = Object.create({
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.codemirror();
      this.events();
    },

    events: function() {
      this.$el.on('click', '.js-run', function() {
        
      });
    },

    codemirror: function codemirror() {
      console.log('Init codemirror');
      var editor = CodeMirror.fromTextArea(this.$el.find('textarea')[0], {
        mode: 'gherkin',
        extraKeys: {
          "Ctrl-Space": function(cm) {
            CodeMirror.showHint(cm, function(cm, options) {
              window.cm = cm;
              console.log(cm, options);
              var cur = cm.getCursor(), token = cm.getTokenAt(cur);
              var inner = CodeMirror.innerMode(cm.getMode(), token.state);
              var line = cm.getLine(cur.line);
              var steps = { 'Given I browse': 1, 'Given I browse with cookies': 1, 'Then I click on': 1 };


              var pos = (line.match(/^\s*/) || [])[0];
              var start = pos ? pos.length : token.start;
              var word = token.string, end = token.end;
              // if (/[^\w$_-]/.test(word)) {
              //  word = ""; start = end = cur.ch;
              // }
              console.log('pos', pos, start);

              word = line.trim();

              var spec = CodeMirror.resolveMode("text/x-feature");

              var result = [];
              function add(keywords) {
                console.log(word, token, line, cur);
                for (var name in keywords)
                  if (!word || name.lastIndexOf(word, 0) == 0) {
                    result.push(name);
                  }
              }

              var st = token.state.state;
              add(steps);

              if (result.length) return {
                list: result,
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, end)
              };

            }, {});
          }
        }
      });
      window.cm = editor;
    }
  });


  $(function() {
    $('.js-page-feature').each(function() {
      page.init(this);
    });
  });

})(document);
