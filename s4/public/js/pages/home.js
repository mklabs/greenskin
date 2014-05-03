(function(doc) {

  var Page = {
    init: function(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});
        
      setTimeout(this.pool.bind(this), 5000);
    },

    pool: function() {
        var req = $.ajax({
        	url: location.pathname,
        });
        
        var self = this;
        req.success(function(res) {
          res = $(res);
          var html = res.find('.js-home');

          self.$el.html(html);
          setTimeout(function() {
            self.pool();
          }, 5000);
        });
        
        req.error(function() {
            console.log('NOK', arguments);
        });
        
        return req;
    }
  };


  $(function() {
      
    $('.js-home').each(function() {
        var page = Object.create(Page);
        page.init(this);
        
        $(this).data('page', page);
    });
      
  });

})(document);
