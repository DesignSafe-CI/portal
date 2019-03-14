
import _ from 'underscore';
export const DataService = function($rootScope, $http, $q, djangoUrl, Logging) {
    'ngInject';

    var logger = Logging.getLogger('ngDesignSafe.DataService');

    var service = {};

    /**
     * Get a list of Data Sources.
     * @returns {HttpPromise} that will be resolved with a list of available data sources.
     */
    service.listSources = function() {
      return $http.get(djangoUrl.reverse('designsafe_api:sources'));
    };


    /**
     * TODO right now this only supports agave systems!
     * @param fileId
     * @returns {{systemId: *, user: *, filePath: *}}
     */
    service.parseFileId = function(fileId) {
      var systemId;
      var user;
      var filePath;

      if (fileId) {
        var parts = fileId.split('/');
        systemId = parts[0];
        user = parts[1];
        filePath = parts.slice(1).join('/');
      } else {
        systemId = 'designsafe.storage.default';
        /* TODO get from django.context constants; */
        user = '';
        /* TODO get from django.context constants */
        filePath = '';
      }

      return {
        systemId: systemId,
        user: user,
        filePath: filePath
      };
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
      if (options.page){
        var offset = options.page * 100;
        url += '&offset=' + offset;
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
        permissions: options.permissions
      };
      return $http.put(djangoUrl.reverse('designsafe_api:file', params), body);
    };

    /**
     *
     * Search in the ES index using a query string.
     * An array with the string name of each extra field to search
     * can be passed.
     *
     * @param {string} q
     * @param {array} fields
    */
    service.search = function(resource, q, fields, page){
      var params = {
        resource: resource
      };
      var url = djangoUrl.reverse('designsafe_api:search', params);
      url += '&q=' + q;
      if (fields && fields.length >= 1){
        url += '&fields=' + fields;
      }
      if (page){
        var offset = page * 100;
        url += '&offset=' + offset;
      }
      return $http.get(url);
    };

    service.updateMeta = function(options){
      var params = {
        resource: options.resource,
        file_id: options.file_id
      };
      var body = {
        action: 'update_metadata',
        meta_obj: options.meta_obj
      };
      var url = djangoUrl.reverse('designsafe_api:file', params);
      return $http.put(url, body);
    };

    return service;

  }
