(function(doc, exports) {

  var CreateFeaturePage = exports.CreateFeaturePage = Object.create(CreatePage);
  CreateFeaturePage.init = function init(el, config) {
    this.el = el;
    this.$el = $(this.el);

    if (!this.$el.length) return;

    this.data = $.extend({}, this.$el.data(), config || {});
    this.runUrl = this.$el.data('runUrl');

    this.cron();
    this.table(doc.querySelector('.js-features'));

    var socket = this.socket = io.connect('/');
  };

  CreateFeaturePage.added = function added(row) {
    this.codemirror('gherkin', row);
  };

  CreateFeaturePage.codemirror = function codemirror(mode, context) {
    mode = mode || 'gherkin';
    // Build codemirror instance
    context = context || this.$el;
    context = context instanceof $ ? context : $(context);

    var textareas = context.find('[name=' + mode + ']');
    var log = context.find('.js-log');

    if (!textareas.length) return;

    var self = this;
    var textarea = textareas[0];
    var cm = CodeMirror.fromTextArea(textarea, {
      mode: mode,
      tabSize: 2,
      extraKeys: {
        "Ctrl-Space": self.complete.bind(self),
        "Ctrl-R": self.run.bind(self, log)
      }
    });

    textareas.next('.CodeMirror').addClass('form-control');
    textareas.data('codemirror', cm);
  };

  CreateFeaturePage.run = function run(log, editor) {
    log = log || this.log;

    log.html('Running ' + this.runUrl + ' ...\n');

    if (!this.validateTable()) {
      return;
    }

    var data = this.serializeTable(log.closest('tr'));
    var runUrl = this.runUrl;
    var timestamp = Date.now();

    var socket = this.socket;
    var logHandler = this.addLog.bind(this, log);
    socket.on('log.' + timestamp, logHandler);

    var req = $.ajax({
      method: 'POST',
      url: runUrl,
      data: {
        config: JSON.stringify(data),
        timestamp: timestamp
      }
    });

    req.success(function() {
      console.log('OK', arguments);
    });

    req.error(function() {
      console.log('NOK', arguments);
    });

    req.complete(function() {
      socket.removeListener('log.' + timestamp, logHandler);
    });
  };

  CreateFeaturePage.validateTable = function validateTable(table) {
    table = table || this.$el.find('.js-features table');
    var rows = table.find('.feature-edit-row').not('.js-row-template');
    var err = false;

    rows.each(function() {
      var row = $(this);
      var input = row.find('.js-input');
      var name = input.val();
      input.closest('div')[name ? 'removeClass' : 'addClass']('has-error');
      if (!name) {
        err = true;
      }
    });

    return !err;
  };

  CreateFeaturePage.serializeTable = function serializeTable(rows) {
    var data = {};
    var features = data.features = [];

    rows.each(function() {
      var row = $(this);
      var name = row.find('.js-input').val();
      var textarea = row.find('[name=gherkin]');
      var editor = textarea.data('codemirror');
      var body = editor ? editor.getValue() : textarea.val();
      features.push({
        name: name,
        body: body
      });
    });

    return data;
  };

  CreateFeaturePage.complete = function complete(cm) {
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
  };

  CreateFeaturePage.table = function table(el) {
    // URLs table
    var urlAdd = el.querySelector('.js-add');
    var tbody = el.querySelector('tbody');
    var template = el.querySelector('.js-row-template');
    var createRow = el.querySelector('.js-create-row');
    var self = this;

    // Link for add button
    urlAdd.addEventListener('click', function(e) {
      e.preventDefault();
      var tpl = template.cloneNode(true);
      var replacement = tpl.querySelector('select') ? 'metric-DOMinserts' : '';
      tpl.className = tpl.className.replace(/is-hidden/, '');
      tpl.className = tpl.className.replace(/js-row-template/, replacement);
      var el = $(tpl);
      el.find('.js-select-metrics').select2();
      tbody.insertBefore(tpl, createRow);

      if (typeof self.added === 'function') {
        self.added(tpl);
      }
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
        console.log('TODO: edit step');
      }

      if (target.classList.contains('js-delete')) {
        row = target.parentElement.parentElement;
        tbody.removeChild(row);
      }

    }, true);
  };

  CreateFeaturePage.addLog = function addLog(log, data) {
    var ansiparsed = ansiparse(data.line);
    var tokens = ansiparsed.map(function(token) {
      var klass = token.foreground || '';

      if (klass === 'cyan' && /Pending/.test(token.text)) {
        return '<a href="#" class="' + klass + ' js-pending">' + token.text + '</a>';
      }

      return '<span class="' + klass + '">' + token.text + '</span>';
    });

    log.append(tokens.join(''));
  };

  $(function() {
    $('.js-job-feature-form').each(function() {
      var page = Object.create(CreateFeaturePage);
      page.init(this);

      $(this).data('page', page);
    });
  });

})(document, this);
