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

    this.submit();
    this.initTableFromJSON();
    this.initDialogFromJSON();

    var socket = this.socket = io.connect(location.hostname + ':3000');
  };

  CreateFeaturePage.submit = function submit() {
    var self = this;

    var form = this.$el;
    form.on('submit', function(e) {
      var rows = self.$el.find('.js-features .js-edit-row').not('.js-row-template');
      var errors = self.validateTable(rows);

      if (errors) {
        e.preventDefault();
        return;
      }

      var data = self.serializeTable(rows);
      form.find('[name=json_config]').val(JSON.stringify(data));
    });
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


    var error = this.validateTable(log.closest('tr'));

    if (error) {
      return log.html(error.message || '');
    }

    var data = this.serializeTable(log.closest('tr'));
    var runUrl = this.runUrl;
    var timestamp = Date.now();

    var socket = this.socket;
    var logHandler = this.addLog.bind(this, log);
    var imgHandler = this.addImage.bind(this, log);

    socket.on('log.' + timestamp, logHandler);
    socket.on('step.' + timestamp, imgHandler);

    log.html('Job workspace: <a class="grey" href="/tmp/' + timestamp + '">/tmp/' + timestamp + '</a>\n');
    log.closest('.row').find('.js-imgs').empty();

    var req = $.ajax({
      method: 'POST',
      url: runUrl,
      data: {
        config: JSON.stringify(data),
        timestamp: timestamp
      }
    });

    req.success(function(data) {
      var ws = data.workspace;
      log.append('<span class="grey"><a class="grey" href="' + ws + '">' + ws + '</a></span>');
      console.log('OK', arguments);
    });

    req.error(function() {
      console.log('NOK', arguments);
    });

    req.complete(function() {
      socket.removeListener('log.' + timestamp, logHandler);
      socket.removeListener('step.' + timestamp, imgHandler);
    });
  };

  CreateFeaturePage.validateTable = function validateTable(rows) {
    var err = false;

    rows.each(function() {
      var row = $(this);
      var input = row.find('.js-input');
      var name = input.val();
      input.closest('div')[name ? 'removeClass' : 'addClass']('has-error');
      if (!name) {
        err = { message: 'Missing feature name' };
      }
    });

    return err;
  };

  CreateFeaturePage.serializeTable = function serializeTable(rows) {
    var data = {};
    var features = data.features = [];
    var steps = data.steps = [];

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

    data.steps = this.serializeDialog();

    return data;
  };

  CreateFeaturePage.serializeDialog = function serializeDialog() {
    var editors = this.editors;

    var data = [];
    var codemirrors = $('.js-dialog .js-codemirror');

    codemirrors.each(function() {
      var codemirror = $(this);
      var editor = codemirror.data('codemirror');
      var name = codemirror.data('name');
      data.push({
        name: name,
        body: editor.getValue()
      });

    });

    console.log('Getting ed', data);
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
    var urlAdd = this.urlAdd = el.querySelector('.js-add');
    var tbody = this.tbody = el.querySelector('tbody');
    var createRow = this.createRow = el.querySelector('.js-create-row');
    var template = this.template = el.querySelector('.js-row-template');
    var self = this;

    // Link for add button
    urlAdd.addEventListener('click', this.addRow.bind(this), false);

    // Click links toggle edit mode
    el.addEventListener('click', function(e) {
      var target = e.target;
      if (!target) return;

      if (target.classList.contains('js-gothrough')) {
        return;
      }
      
      e.preventDefault();

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
        $(target).closest('tr').remove();
      }

    }, true);
  };

  CreateFeaturePage.addRow = function addRow(e) {
    if (e && e.preventDefault) e.preventDefault();

    var template = this.template;
    var tbody = this.tbody;
    var createRow = this.createRow;

    var tpl = template.cloneNode(true);
    var replacement = tpl.querySelector('select') ? 'metric-DOMinserts' : '';
    tpl.className = tpl.className.replace(/is-hidden/, '');
    tpl.className = tpl.className.replace(/js-row-template/, replacement);
    var el = $(tpl);
    el.find('.js-select-metrics').select2();
    tbody.insertBefore(tpl, createRow);

    if (typeof this.added === 'function') {
      this.added(tpl);
    }

    return tpl;
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

  CreateFeaturePage.addImage = function addImage(log, data) {
    console.log('addImage', data);
    var file = data.file;
    var row = log.closest('.row');
    var imgbox = row.find('.js-imgs');
    var img = $('<img src="' + file + '" />').attr('width', 200).attr('height', 120);
    var a = $('<a class="thumbnail left"/>').attr('href', file).append(img);
    imgbox.append(a);
  };


  CreateFeaturePage.initTableFromJSON = function initTableFromJSON() {
    var json = this.$el.find('[name=json_config]');
    if (!json.length) return;

    var data = {};
    try {
      data = JSON.parse(json.val());
    } catch(e) {}

    var el = this.el;
    var urlAdd = this.urlAdd = el.querySelector('.js-add');
    var tbody = this.tbody = el.querySelector('tbody');
    var createRow = this.createRow = el.querySelector('.js-create-row');
    var template = this.template = el.querySelector('.js-row-template');

    if (!data.features) return;

    data.features.forEach(function(feature) {
      var el = this.addRow();
      var row = $(el);
      row.find('.js-input').val(feature.name);
      var textarea = row.find('[name=gherkin]');
      textarea.val(feature.body);
      var editor = textarea.data('codemirror');
      editor.refresh();
      editor.setValue(feature.body);
    }, this);
  };


  CreateFeaturePage.initDialogFromJSON = function initTableFromJSON() {
    var json = this.$el.find('[name=json_config]');
    if (!json.length) return;

    var data = {};
    try {
      data = JSON.parse(json.val());
    } catch(e) {}

    var dialog = $('.js-dialog');
    var code = dialog.find('.js-code');
    var dialogBody = dialog.find('.modal-body');
    var steps = data.steps;
    var editors = [];
    
    steps.forEach(function(step) {
      // $('<h5 />').text(step.name).appendTo(dialogBody);

      var div = $('<div class="js-codemirror codemirror" />').data('name', step.name);
      div.appendTo(dialogBody);
      var editor = CodeMirror(div[0], {
        value: step.body,
        mode:  "javascript"
      });

      div.data('codemirror', editor);
      editors.push(editor);
    });

    dialog.on('shown.bs.modal', function() {
      editors.forEach(function(ed) {
        ed.refresh();
      });

    });
  };

  $(function() {
    $('.js-job-feature-form').each(function() {
      var page = Object.create(CreateFeaturePage);
      page.init(this);

      $(this).data('page', page);
    });
  });

})(document, this);
