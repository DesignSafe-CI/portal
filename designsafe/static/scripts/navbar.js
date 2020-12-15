(function(window, $, undefined) {

  var supportPageOffset = window.pageXOffset !== undefined;
  var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");


  // if (window.location.pathname === '/search/') {
  //   $('#sitewide_search').hide();
  // }

  $('#search_button').on('keypress click', function (ev) {
    ev.preventDefault();
    var searchstring = $('#searchfield').val();
    if (ev.which === 13 || ev.type === 'click') {
      window.location = '/search?type_filter=all&query_string=' + searchstring;
    }
  });



  // if (window.location.pathname === '/') {
  //   var navbar = $('.navbar-ds');
  //   var getCurrentSection = function(e) {
  //     var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
  //     y = y+1;
  //     var active = {
  //       community: false,
  //       research: false,
  //       ef: false,
  //       learning: false
  //     };
  //     var pos = {
  //       community: $('#community').offset().top,
  //       research: $('#research').offset().top,
  //       ef: $('#ef').offset().top,
  //       learning: $('#learning').offset().top
  //     };
  //     if (y >= pos.learning) {
  //       return 'learning';
  //     } else if (y >= pos.ef) {
  //       return 'ef';
  //     } else if (y >= pos.research) {
  //       return 'research';
  //     } else if (y >= pos.community) {
  //       return 'community';
  //     } else {
  //       return false;
  //     }
  //   };

  //   window.history.replaceState({}, 'current_section', window.location.hash);

  //   var activateSection = function() {
  //     var section = getCurrentSection();
  //     var state = {};
  //     var hash = window.location.hash;

  //     if (section) {
  //       hash = '#' + section;
  //       state.section = hash;
  //     }

  //     if (hash.length) {
  //       window.history.replaceState(state, 'current_section', hash);
  //     }

  //     var activeNav = false;
  //     if (hash.length && hash !== '#') {
  //       activeNav = $('a[href="/' + hash + '"]', navbar);
  //       activeNav.parent().addClass('active');
  //     }
  //     $('a', navbar).not(activeNav).parent().removeClass('active');
  //   };

  //   $(document).on('scroll', window.throttle(activateSection, 100));
  //   //activateSection();
  // }

})(window, jQuery);
