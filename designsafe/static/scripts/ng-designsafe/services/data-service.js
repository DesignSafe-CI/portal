(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('DataService', ['$rootScope', '$http', '$q', 'djangoUrl', 'Logging',
    function($rootScope, $http, $q, djangoUrl, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.DataService');

    var service = {};


    /**
     * Get a list of Data Sources.
     * @returns {HttpPromise} that will be resolved with a list of available data sources.
     */
    service.listSources = function() {
      return $http.get(djangoUrl.reverse('designsafe_api:sources'));
    };
    
    
    service.getIcon = function(type, ext) {
      if (type === 'folder') {
        return 'fa-folder';
      }

      var icon;
      switch (ext.slice(1)) {
        case 'zip':
        case 'tar':
        case 'gz':
        case 'bz2':
          icon = 'fa-file-archive-o';
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'tif':
        case 'tiff':
          icon = 'fa-file-image-o';
          break;
        case 'pdf':
          icon = 'fa-file-pdf-o';
          break;
        case 'doc':
        case 'docx':
          icon = 'fa-file-word-o';
          break;
        case 'xls':
        case 'xlsx':
          icon = 'fa-file-excel-o';
          break;
        case 'ppt':
        case 'pptx':
          icon = 'fa-file-powerpoint-o';
          break;
        case 'mov':
        case 'mp4':
          icon = 'fa-file-video-o';
          break;
        case 'mp3':
        case 'wav':
          icon = 'fa-file-audio-o';
          break;
        case 'txt':
        case 'out':
        case 'err':
          icon = 'fa-file-text-o';
          break;
        case 'tcl':
        case 'sh':
        case 'json':
          icon = 'fa-file-code-o';
          break;
        default:
          icon = 'fa-file-o';
      }
      return icon;
    };


    /**
     *
     * @param options {object}
     * @param options.source {string} the `source` to list.
     * @param options.id {object} the `id` of the file to list. The type and format of `id` varies based on `source`.
     */
    service.listPath = function(options) {
      options = options || {};
      return $http.get(djangoUrl.reverse('designsafe_api:list', options));
    };


    /**
     *
     * @param options
     */
    service.getFile = function(options) {};


    /**
     *
     * @param options
     */
    service.upload = function(options) {};


    /**
     *
     * @param options
     */
    service.download = function(options) {
      options = options || {};
      return $http.put(djangoUrl.reverse('designsafe_api:file', options), {action: 'download'});
    };


    /**
     *
     * @param options
     */
    service.preview = function(options) {
      options = options || {};
      return $http.put(djangoUrl.reverse('designsafe_api:file', options), {action: 'preview'});
    };


    /**
     *
     * @param options
     */
    service.trash = function(options) {};


    /**
     *
     * @param options
     */
    service.delete = function(options) {};


    /**
     *
     * @param options
     */
    service.move = function(options) {};


    /**
     *
     * @param options
     */
    service.copy = function(options) {};


    /**
     *
     * @param options
     */
    service.rename = function(options) {};

    return service;

  }]);
  

})(window, angular, jQuery, _);
