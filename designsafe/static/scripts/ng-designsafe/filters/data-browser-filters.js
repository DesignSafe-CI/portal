(function(window, angular, $, _) {

  var mod = angular.module('ng.designsafe');


  mod.filter('dsFileUrl', [function() {
    return function(file, baseHref) {
      var base = $('base');

      /*
       * We want to compact the path to remove "falsy" values. This is because
       * the path could be empty or null if we are listing the root of the resource.
       */
      var components = [file.source, file.system];
      if (file.path && file.path !== '/') {
        components.push(file.path);
      }
      components.push(file.name);
      var path = _.compact(components).join('/');

      if (file.type && file.type === 'folder') {
        path += '/';
      }

      if (baseHref && base.length) {
        path = base.attr('href').slice(0, -1) + path;
      }

      return path;
    }
  }]);

  mod.filter('dsFileIcon', ['DataService', function(DataService) {
    return function(file) {
      return DataService.getIcon(file.type, file.ext);
    }
  }]);
})(window, angular, jQuery, _);
