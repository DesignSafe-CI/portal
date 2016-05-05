(function(window, angular, $, _) {

  var mod = angular.module('ng.designsafe');


  mod.filter('dsFileUrl', [function() {
    return function(file, baseHref) {
      var base = $('base');

      /*
       * We want to compact the path to remove "falsy" values. This is because
       * the path could be empty or null if we are listing the root of the resource.
       * Then, encode the path components to be URL safe and join with '/'.
       */
      var path = _.chain([file.source, file.path, file.name])
                  .compact()
                  .map(encodeURIComponent).value().join('/');

      if (baseHref && base.length) {
        path = base.attr('href').slice(0, -1) + path;
      }

      return path;
    }
  }]);
})(window, angular, jQuery, _);
