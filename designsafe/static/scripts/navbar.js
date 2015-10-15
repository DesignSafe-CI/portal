(function(window, $, undefined) {
  function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
      var context = scope || this;

      var now = +new Date,
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }

  $(window).on('scroll', throttle(function(e) {
    var h = $('.site-banner').height();
    if (e.originalEvent.pageY > h) {
      $('.navbar-ds').addClass('navbar-fixed-top');
      $('body').addClass('navbar-fixed');
    } else {
      $('.navbar-ds').removeClass('navbar-fixed-top');
      $('body').removeClass('navbar-fixed');
    }
  }, 100));

})(this, jQuery);