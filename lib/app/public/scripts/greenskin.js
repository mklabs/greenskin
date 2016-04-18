(function ($) {

  var greenskin = {};

  greenskin.goTo = function() {
    location.href = '/job/' + $(this).data('name');
  };

  greenskin.init = function() {
    $('[data-event]').each(function(i) {
      var el = $(this);
      var handler = el.data('handler');
      var type = el.data('event');

      if (!greenskin[handler]) return;
      el.on(type, greenskin[handler]);
    });
  };

  $(greenskin.init);
})(jQuery);
