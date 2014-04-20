(function(doc) {

  var FeaturePage = {
  init: function(el, config) {
    this.el = el;
    this.$el = $(this.el);

    if (!this.$el.length) return;

    this.data = $.extend({}, this.$el.data(), config || {});
    this.runUrl = this.$el.find('.js-run').attr('href');
    this.saveUrl = this.$el.find('.js-form-feature').attr('action');
    this.stepdir = this.$el.attr('data-stepdir');

    var log = this.log = this.$el.find('.js-log');

    this.codemirror();
    this.events();

    var socket = this.socket = io.connect(location.host + ':3000');
    this.socket.on('log', function(data) {
        var ansiparsed = ansiparse(data.line);
        var tokens = ansiparsed.map(function(token) {
          var klass = token.foreground || '';

          if (klass === 'cyan' && /Pending/.test(token.text)) {
            return '<a href="#" class="' + klass + ' js-pending">' + token.text + '</a>';
          }

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

    this.$el.on('click', '.js-pending', function(e) {
      e.preventDefault();
      var filename = prompt('Filename:');
      if (!filename) return;

      if (!/\.js$/.test(filename)) filename = filename + '.js';

      var line = $(e.target);
      var text = line.text();

      text = text.trim().replace(/^-\s*/, '');

      var keywordReg = /^(Given|And|Then|When)/;
      var keyword = (text.match(keywordReg) || [])[1];

      var el = line.get(0);
      var found = false;
      if (keyword === 'And') {
        (function lookupKeyword(item) {
          if (found) return;
          if (!item) return;
          var prev = item.previousSibling;
          var txt = prev.innerText.trim().replace(/^-\s*/, '');
          var kwd = (txt.match(/^(Given|Then|When)/) || [])[1];
          if (kwd) {
            found = true;
            keyword = kwd;
          } else {
            lookupKeyword(prev);
          }
        })(el);
      }

      var reg = text
        .replace('(Pending)', '')
        .replace('(Click to implement)', '');

      reg = reg.replace(/"[^"]+"/g, '"([^"]+)"');

      var args = (reg.match(/\"\(\[\^\"\]\+\)\"/g) || []);

      args = args.map(function(arg, i) {
        return 'arg' + i;
      });

      args.push('done');


      reg = reg.replace(keywordReg, '').trim();
      var snippet = keyword + '(/' + reg + '/, function(' + args.join(', ') + ') {\n';
      snippet += '  done();\n';
      snippet += '});';

      var url = self.stepdir + filename;
      var post = $.ajax({
        type: 'POST',
        url: url,
        data: {
          code: snippet
        }
      });

      post.success(function() {
           location.href = url;
      });

      console.log(reg);
      console.log(snippet);
    });

    this.$el.on('mouseover', '.js-pending', function(e) {
    var line = $(e.target);
    var text = line.text().replace('(Pending)', '(Click to implement)');
    line.text(text);
    });

    this.$el.on('mouseout', '.js-pending', function(e) {
    var line = $(e.target);
    var text = line.text().replace('(Click to implement)', '(Pending)');
    line.text(text);
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
    this.log.html('Running ' + this.runUrl + ' ...\n');

    var save = this.save();
    var runUrl = this.runUrl;
    save.success(function() {
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
      var tokens = window.steps || {};
      var pos = (line.match(/^\s*/) || [])[0];
      var start = pos ? pos.length : token.start;
      var word = token.string, end = token.end;

      word = line.trim();

      console.log(word);
      var spec = CodeMirror.resolveMode("text/x-feature");

      var result = [];
      function add(keywords) {
      for (var name in keywords)
        if (/^An?d?/.test(word)) {
          result.push(name);
        } else if (!word || name.lastIndexOf(word, 0) === 0) {
          result.push(name);
        }
      }

      var st = token.state.state;
      add(tokens);

      if (result.length) return {
      list: result.sort(),
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
