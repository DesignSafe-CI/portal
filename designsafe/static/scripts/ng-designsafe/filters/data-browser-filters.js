(function(window, angular, $, _) {

  var mod = angular.module('ng.designsafe');


  mod.filter('dsFileUrl', [function() {
    return function(file, baseHref) {
      var base = $('base');

      /*
       * We want to compact the path to remove "falsy" values. This is because
       * the path could be empty or null if we are listing the root of the resource.
       */
      var path = _.compact([file.source, file.system, file.path, file.name]).join('/');

      if (file.type && file.type === 'folder') {
        path += '/';
      }

      if (baseHref && base.length) {
        path = base.attr('href').slice(0, -1) + path;
      }

      return path;
    }
  }]);
})(window, angular, jQuery, _);
