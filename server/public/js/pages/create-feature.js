(function(doc, exports) {

  var CreateFeaturePage = exports.CreateFeaturePage = Object.create(CreatePage);
  CreateFeaturePage.init = function init(el, config) {
      this.el = el;
      this.$el = $(this.el);

      if (!this.$el.length) return;

      this.data = $.extend({}, this.$el.data(), config || {});

      this.cron();
      this.table(doc.querySelector('.js-features'));
  };


  $(function() {
    $('.js-job-feature-form').each(function() {
      var page = Object.create(CreateFeaturePage);
      page.init(this);

      $(this).data('page', page);
    });
  });

})(document, this);
