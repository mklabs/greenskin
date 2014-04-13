(function(doc) {

  var FeaturePage = {
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});
      this.runUrl = this.$el.find('.js-run').attr('href');
      this.saveUrl = this.$el.find('.js-form-feature').attr('action');
        
      var log = this.log = this.$el.find('.js-log');

      this.codemirror();
      this.events();
        
      var socket = this.socket = io.connect('/');
      this.socket.on('log', function(data) {
       	var ansiparsed = ansiparse(data.line);
        console.log('log:', data.line);
          
        var tokens = ansiparsed.map(function(token) {
            var klass = token.foreground || '';
            return '<span class="' + klass + '">' + token.text + '</span>';
        });
          
        log.append(tokens.join(''));
      });
    },

    events: function() {
      var self = this;
      this.$el.on('click', '.js-run', function(e) {
          e.preventDefault();
          self.run();
      });
    },

    codemirror: function codemirror() {
      var editor = this.editor = CodeMirror.fromTextArea(this.$el.find('textarea')[0], {
        mode: 'gherkin',
        extraKeys: {
          "Ctrl-Space": this.complete.bind(this),
          "Ctrl-R": this.run.bind(this),
          "Ctrl-S": this.save.bind(this)
        }
      });
    },
      
    run: function(cm) {
        console.log('Run!', this, arguments);
        console.log(this.runUrl);
        
        this.log.html('Running ' + this.runUrl + ' ...\n\n');
        
        console.log('Saving');
        
        var save = this.save();
       
        var runUrl = this.runUrl;
        save.success(function() {
            console.log('Saved', arguments);
            
            var req = $.ajax({
                url: runUrl
            });

            req.success(function() {
                console.log('OK', arguments);
            });

            req.error(function() {
                console.log('NOK', arguments);
            });
        });
    },
      
    save: function() {
        // Ensure textarea is updated with editor content
        this.$el.find('[name=code]').val(this.editor.getValue());
        
        var req = $.ajax({
        	url: this.saveUrl,
            data: this.$el.find('.js-form-feature').serializeArray(),
            type: 'POST'
        });
        
        req.success(function() {
            console.log('OK', arguments);
        });
        
        req.error(function() {
            console.log('NOK', arguments);
        });
        
        return req;
    },
      
    complete: function(cm) {
        CodeMirror.showHint(cm, function(cm, options) {
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
  };


  $(function() {
      
    $('.js-page-feature').each(function() {
        var page = Object.create(FeaturePage);
        page.init(this);
        
        $(this).data('page', page);
    });
      
  });

})(document);
