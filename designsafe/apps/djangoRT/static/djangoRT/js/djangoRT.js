(function($) {

  $.expr[":"].containsNoCase = $.expr.createPseudo(function(arg) {
    return function(elem) {
      return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
  });

  $(document).ready(function() {

    $(".search").on('keyup', function() {
      var searchTerms = $(this).val();
      if (searchTerms != "") {
        $(".ticket").filter(function() {
          return !$(this).is(":containsNoCase('" + searchTerms +
            "')");
        }).addClass("none");

        $(".ticket").filter(function() {
          return $(this).is(":containsNoCase('" + searchTerms +
            "')");
        }).removeClass("none");
      } else {
        $(".ticket").removeClass("none");
      }
    });

    $('.errorlist').each(function() {
      $(this).addClass('none');
      $(this).next('p').addClass('required');
    });

  });
})(jQuery);
