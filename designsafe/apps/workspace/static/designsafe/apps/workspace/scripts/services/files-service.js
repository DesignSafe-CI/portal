(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Files',
  ['$http', 'djangoUrl', function($http, djangoUrl) {
    var service = {};

    service.list = function(options) {
      return $http.get(
        djangoUrl.reverse('designsafe_workspace:call_api', ['files']),
        {params: {'system_id': options.systemId, 'file_path': options.path}}
      );
    };

    service.choose = function(file) {
      alert('agave://' + file.system + '/' + file.path);
    };

    service.icon = function(file) {
      var icon;
      if (file.type === 'dir') {
        icon = 'folder';
      } else {
        var ext = file.name.split('.').pop().toLowerCase();
        switch (ext) {
          case 'zip':
          case 'tar':
          case 'gz':
          case 'bz2':
            icon = 'file-archive-o';
            break;
          case 'png':
          case 'jpg':
          case 'jpeg':
          case 'gif':
          case 'tif':
          case 'tiff':
            icon = 'file-image-o';
            break;
          case 'pdf':
            icon = 'file-pdf-o';
            break;
          case 'txt':
          case 'tcl':
          case 'out':
          case 'err':
          case 'json':
            icon = 'file-text-o';
            break;
          default:
            icon = 'file-o';
        }
      }
      return icon;
    };

    return service;
  }]);
})(window, angular, jQuery, _);
