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

  var supportPageOffset = window.pageXOffset !== undefined;
  var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

  var fixer = function(e) {
    var h = $('.site-banner').height();
    var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
    if (y > h) {
      $('.navbar-ds').addClass('navbar-fixed-top');
      $('body').addClass('navbar-fixed');
    } else {
      $('.navbar-ds').removeClass('navbar-fixed-top');
      $('body').removeClass('navbar-fixed');
    }
  };
  $(document).on('scroll', throttle(fixer, 100));
  fixer();

})(this, jQuery);