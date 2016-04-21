/**
 * Created by mrhanlon on 4/20/16.
 */
(function(window, angular, $, _) {
  "use strict";
  var app = angular.module('BoxFilesApp');
  app.factory('BoxFiles', ['$rootScope', '$http', '$q', 'djangoUrl', function($rootScope, $http, $q, djangoUrl) {
    var service = {};

    /**
     * Return a nice URL path component for an item. The first item in anyone's Box is
     * called "All Files" and we want to simply represent that as "/" in the path.
     *
     * @param item
     * @returns {String} the URL path
     */
    service.url_path = function(item) {
      var path = _.pluck(item.path_collection.entries, 'name')
      if (path.length > 0) {
        path[0] = '';
        path.push(item.name)
      }
      return path.join('/')
    };

    /**
     * List of supported preview extensions. Supported file types from Box:
     * https://box-content.readme.io/reference#get-embed-link
     * @type {string[]}
     */
    var preview_extensions = [
      /* Files */
      'as', 'as3', 'asm', 'bat', 'c', 'cc', 'cmake', 'cpp', 'cs', 'css', 'csv', 'cxx',
      'diff', 'doc', 'docx', 'erb', 'gdoc', 'groovy', 'gsheet', 'h', 'haml', 'hh', 'htm',
      'html', 'java', 'js', 'less', 'm', 'make', 'ml', 'mm', 'msg', 'ods', 'odt', 'odp',
      'pdf', 'php', 'pl', 'ppt', 'pptx', 'properties', 'py', 'rb', 'rtf', 'sass', 'scala',
      'scm', 'script', 'sh', 'sml', 'sql', 'txt', 'vi', 'vim', 'wpd', 'xls', 'xlsm',
      'xlsx', 'xml', 'xsd', 'xsl', 'yaml',

      /* Images */
      'ai', 'bmp', 'gif', 'eps', 'jpeg', 'jpg', 'png', 'ps', 'psd', 'svg', 'tif', 'tiff',
      'dcm', 'dicm', 'dicom', 'svs', 'tga',

      /* Audio */
      'aac', 'aifc', 'aiff', 'amr', 'au', 'flac', 'm4a', 'mp3', 'ogg', 'ra', 'wav', 'wma',

      /* Video */
      '3g2', '3gp', 'avi', 'm2v', 'm2ts', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg',
      'ogg', 'mts', 'qt', 'wmv'
    ];

    /**
     * 
     * @param {Object} item - The Box Item to preview
     * @returns {HttpPromise}
     */
    service.previewUrl = function(item) {
      if (item.type === 'file') {
        var args = {item_type: 'file', item_id: item.id};
        var ext = item.name.split('.').pop().toLowerCase();
        if (_.indexOf(preview_extensions, ext) > -1) {
          return $http.get(djangoUrl.reverse('box_integration:box_api', args), {params: {embed: true}});
        }
      }
      return $q.resolve({data:{expiring_embed_link:{url: false}}});
    };

    /**
     * Query Box for an item (file or folder).
     * @param {Object} options
     * @param {string} options.item_type - The type of item "file" or "folder". Defaults to "folder".
     * @param {number} options.item_id - The id of the item. Defaults to "0" for "All Files".
     * @returns {HttpPromise}
     */
    service.list = function(options) {
      options = options || {};
      var args = _.extend({item_type: "folder", item_id: 0}, options);
      return $http.get(djangoUrl.reverse('box_integration:box_api', args));
    };

    /**
     *
     * @param item - The Box item to download (files only)
     * @returns {HttpPromise} - A promise that will be resolved with the 'download_url' in the data object.
     */
    service.downloadUrl = function(item) {
      if (item.type === 'file') {
        var args = {item_type: 'file', item_id: item.id};
        return $http.get(djangoUrl.reverse('box_integration:box_api', args), {params: {download:true}});
      } else {
        return $q.resolve({data:{download_url: false}});
      }
    };

    /**
     * If item is a file, trigger an Agave.files.importData call. If item is a folder, then
     * trigger an Agave.files.manage(mkdir) call, and then call service.copyToMyData for each
     * item.
     *
     * @param {Object} item - The Box item to copy
     * @param {Object} options - additional options
     * @param {string} options.dir - the destination directory in "My Data"
     * @returns {HttpPromise} A promise that will be resolved with item (and all of its
     *                        children) is copied.
     */
    service.copyToMyData = function(item, options) {
      options = options || {};
      var params = _.extend({dir: ''}, options);
      var args = {item_type: item.type, item_id: item.id};

      if (item.type === 'file') {
        params.op = 'files.importData';
        return $http.post(djangoUrl.reverse('box_integration:box_api', args), {params: params});
      } else {
        return $q.reject('Folder copy not implemented!');
      }
    };

    /**
     *
     * @param file
     * @returns {String} the icon class to use
     */
    service.icon = function(file) {
      var icon;
      if (file.type === 'dir' || file.type === 'folder') {
        icon = 'folder';
      } else if (file.type === 'web_link') {
        icon = 'link';
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
