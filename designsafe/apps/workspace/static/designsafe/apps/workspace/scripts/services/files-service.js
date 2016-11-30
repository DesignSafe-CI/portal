(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('Files',
  ['$rootScope', '$http', 'djangoUrl', function($rootScope, $http, djangoUrl) {
    var service = {};

    service.list = function(options) {
      return $http.get(
        djangoUrl.reverse('designsafe_workspace:call_api', ['files']),
        {params: {'system_id': options.systemId, 'file_path': options.path}}
      );
    };

    /**
     * Request a file form another controller. Broadcasts a 'wants-file' event with
     * argument: `{ requestKey: <string>, title: <string>, description: <string>}`.
     *
     * Parameters:
     *    requestKey: A unique identifier for this request
     *    options:    (optional) An object with properties
     *                "title" and "description" to describe
     *                the requested file.
     */
    service.wantFile = function(requestKey, options) {
      var title = options.title || requestKey;
      var description = options.description || '';
      $rootScope.$broadcast('wants-file', {
        requestKey: requestKey,
        title: title,
        description: description
      });
    };

    /**
     * Provide a file to another controller. Broadcasts a 'provides-file' event with
     * argument: `{file: <agaveFile>, requestKey: <string>}`.
     *
     * Parameters:
     *    requestKey: A unique identifier for the requested file.
     *    file:       An Agave File object representation.
     */
    service.provideFile = function provideFile(requestKey, file) {
      $rootScope.$broadcast('provides-file', {requestKey: requestKey, file: file});
    };

    service.icon = function(file) {
      var icon;
      if (file.type === 'dir' || file.type === 'folder') {
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
          case 'doc':
          case 'docx':
            icon = 'file-word-o';
            break;
          case 'xls':
          case 'xlsx':
            icon = 'file-excel-o';
            break;
          case 'ppt':
          case 'pptx':
            icon = 'file-powerpoint-o';
            break;
          case 'mov':
          case 'mp4':
            icon = 'file-video-o';
            break;
          case 'mp3':
          case 'wav':
            icon = 'file-audio-o';
            break;
          case 'txt':
          case 'out':
          case 'err':
            icon = 'file-text-o';
            break;
          case 'tcl':
          case 'sh':
          case 'json':
            icon = 'file-code-o';
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
