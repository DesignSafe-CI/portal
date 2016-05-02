(function(window, angular, $) {

  var mod = angular.module('ng.designsafe');


  mod.filter('dsFileUrl', [function() {
    return function(file, baseHref) {
      var base = $('base');

      var path = [file.source, file.path, file.name].map(encodeURIComponent).join('/');

      if (baseHref && base.length) {
        path = base.attr('href').slice(0, -1) + path;
      }

      return path;
    }
  }]);
})(window, angular, jQuery);
