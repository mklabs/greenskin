(function ($) {

  var greenskin = {};

  greenskin.goTo = function() {
    location.href = '/job/' + $(this).data('name');
  };

  greenskin.focus = function(el) {
    console.log('set fc');
    el && el.get(0).focus();
  };

  greenskin.init = function() {
    $('[data-event]').each(function(i) {
      var el = $(this);
      var handler = el.data('action');
      var type = el.data('event');

      if (!greenskin[handler]) return;
      el.on(type, greenskin[handler]);
    });

    $('[data-auto]').each(function(i) {
      var el = $(this);
      var handler = el.data('action');
      var type = el.data('auto');

      if (type === 'ready' && greenskin[handler]) {
        greenskin[handler](el);
      }
    });

    // Quick and dirty refresh job view
    if ($('.mdl-progress').length) {
      setTimeout(function() {
        location.reload();
      }, 5000);
    }
  };

  $(greenskin.init);
})(jQuery);
