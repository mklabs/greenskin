(function(doc) {

  var FeaturePage = {
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});
      this.saveUrl = this.$el.find('.js-form').attr('action');
        
      this.codemirror();
      this.events();
    },

    events: function() {
      var self = this;
    },

    codemirror: function codemirror() {
      var editor = this.editor = CodeMirror.fromTextArea(this.$el.find('textarea')[0], {
        mode: 'javascript',
        extraKeys: {
          "Ctrl-S": this.save.bind(this)
        }
      });
        
      editor.setSize('100%', '100%');
      $('.CodeMirror').addClass('form-control');
    },
      
    save: function() {
        // Ensure textarea is updated with editor content
        this.$el.find('[name=code]').val(this.editor.getValue());
        
        var req = $.ajax({
        	url: this.saveUrl,
            data: this.$el.find('.js-form').serializeArray(),
            type: 'POST'
        });
        
        req.success(function() {
            console.log('OK', arguments);
        });
        
        req.error(function() {
            console.log('NOK', arguments);
        });
        
        return req;
    }
  };


  $(function() {
      
    $('.js-page-step').each(function() {
        var page = Object.create(FeaturePage);
        page.init(this);
        
        $(this).data('page', page);
    });
      
  });

})(document);
