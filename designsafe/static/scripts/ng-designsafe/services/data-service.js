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
      return $q.resolve({"data": [
        {
          "name": "mydata",
          "default_actions": ["*"]
        },
        {
          "name": "shared",
          "default_actions": ["download", "preview", "copy"]
        },
        {
          "name": "public",
          "default_actions": ["download", "preview", "copy"]
        },
        {
          "name": "box",
          "default_actions": ["download", "preview", "copy"]
        }
      ]})
    };


    /**
     *
     * @param options {object}
     * @param options.source {string} the `source` to list.
     * @param options.id {object} the `id` of the file to list. The type and format of `id` varies based on `source`.
     */
    service.listFiles = function(options) {
      options = options || {};
      var params = _.extend({"source": "default"}, options);

      return $q.resolve({"data": [
        {
          "source": "default",
          "name": "Trash",
          "path": "mrhanlon",
          "type": "folder",
          "id": "mrhanlon/Trash",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-trash-o"
          }
        },
        {
          "source": "default",
          "name": "Projects",
          "path": "mrhanlon",
          "type": "folder",
          "id": "mrhanlon/Projects",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-folder"
          }
        },
        {
          "source": "default",
          "name": "Documents",
          "path": "mrhanlon",
          "type": "folder",
          "id": "mrhanlon/Documents",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-folder"
          }
        },
        {
          "source": "default",
          "name": "example_data",
          "path": "mrhanlon",
          "type": "folder",
          "id": "mrhanlon/example_data",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-folder"
          }
        },
        {
          "source": "default",
          "name": "help.pdf",
          "path": "mrhanlon",
          "type": "file",
          "id": "mrhanlon/help.pdf",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-file-pdf-o"
          }
        },
        {
          "source": "default",
          "name": "test.txt",
          "path": "mrhanlon",
          "type": "file",
          "id": "mrhanlon/test.txt",
          "_actions": [],
          "_pems": [],
          "_extra": {
            "icon": "fa-file-text-o"
          }
        }
      ]});
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
    service.download = function(options) {};


    /**
     *
     * @param options
     */
    service.preview = function(options) {};


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
