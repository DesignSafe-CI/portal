(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('DataService', ['$rootScope', '$http', '$q', 'djangoUrl', 'Logging', function($rootScope, $http, $q, djangoUrl, Logging) {

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
      switch (ext.slice(1).toLowerCase()) {
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
     * @param options.resource {string} the `source` to list.
     * @param options.file_id {object} the `id` of the file to list. The type and format of `id` varies based on `source`.
     * @param options.reindex {boolean} whether to trigger a reindexing
     * @param options.index_pems {boolean} whether to index permissions
     */
    service.listPath = function(options) {
      var params = {
        file_id: options.file_id,
        resource: options.resource
      };

      var url = djangoUrl.reverse('designsafe_api:list', params);
      if (options.reindex) {
        url += '&reindex=true';
      }
      if (options.index_pems) {
        url += '&pems=true';
      }
      return $http.get(url);
    };


    /**
     *
     * @param options
     * @param options.file_id The file_id of path in which to create the directory
     * @param options.resource The resource on which file_id is sourced
     * @param options.dir_name The name of the new directory
     */
    service.mkdir = function(options) {
      options = options || {};
      var params = {
        'file_id': options.file_id,
        'resource': options.resource
      };
      var body = {
        'action': 'mkdir',
        'dir_name': options.dir_name
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };


    /**
     *
     * @param {object} options
     * @param {string} options.resource The files resource to upload to.
     * @param {string} options.file_id The file_id to upload to
     * @param {FormData} options.data The FormData to POST for the upload.
     */
    service.upload = function(options) {
      options = options || {};
      var params = {
        resource: options.resource,
        file_id: options.file_id
      };
      var body = options.data;
      body.append('action', 'upload');
      return $http.post(djangoUrl.reverse('designsafe_api:file', params), body, {
        headers : {'Content-Type': undefined}
      });
    };


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
     * @param {string} options.resource
     * @param {string} options.file_id
     */
    service.trash = function(options) {
      options = options || {};
      return $http.put(djangoUrl.reverse('designsafe_api:file', options), {action: 'move_to_trash'});
    };


    /**
     *
     * @param options
     * @param {string} options.resource
     * @param {string} options.file_id
     */
    service.delete = function(options) {
      options = options || {};
      return $http.put(djangoUrl.reverse('designsafe_api:file', options), {action: 'delete'});
    };


    /**
     *
     * @param options
     * @param {string} options.src_resource
     * @param {string} options.src_file_id
     * @param {string} options.dest_resource
     * @param {string} options.dest_file_id
     */
    service.move = function(options) {
      var params = {
        resource: options.src_resource,
        file_id: options.src_file_id
      };
      var body = {
        action: 'move',
        dest_resource: options.dest_resource,
        dest_file_id: options.dest_file_id
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };


    /**
     *
     * @param options
     * @param {string} options.src_resource
     * @param {string} options.src_file_id
     * @param {string} options.dest_resource
     * @param {string} options.dest_file_id
     */
    service.copy = function(options) {
      var params = {
        resource: options.src_resource,
        file_id: options.src_file_id
      };
      var body = {
        action: 'copy',
        dest_resource: options.dest_resource,
        dest_file_id: options.dest_file_id
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };


    /**
     *
     * @param options
     * @param {string} options.resource
     * @param {string} options.file_id
     * @param {string} options.target_name
     */
    service.rename = function(options) {
      var params = {
        resource: options.resource,
        file_id: options.file_id
      };
      var body = {
        action: 'rename',
        target_name: options.target_name
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };

    /**
     * Share files with users.
     * @param {object} options file sharing options
     * @param {string} options.resource
     * @param {string} options.file_id
     * @param {string} options.username
     * @param {string} options.permission
     */
    service.share = function(options) {
      var params = {
        resource: options.resource,
        file_id: options.file_id
      };
      var body = {
        action: 'share',
        user: options.username,
        permission: options.permission
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };

    /**
     *
     * This method accepts either a query string
     * or an object were keys are in the form "q_{field_name}"
     *
     * @param {string} q
     * @param q_kw
    */
    service.search = function(resource, q, q_kw){
      var params = {
        resource: resource
      };
      var url = djangoUrl.reverse('designsafe_api:search', params);
      url += '&q=' + q;
      return $http.get(url);
    };

    return service;

  }]);


})(window, angular, jQuery, _);
