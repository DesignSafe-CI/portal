(function(window, angular, undefined) {
  "use strict";

  var mod = angular.module('ng.designsafe');

  module.factory('ProjectService', ['$http', '$q', 'Logging', function($http, $q, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.ProjectService');

    var service = {};

    service.list = function() {};

    service.get = function(uuid) {};

    service.save = function(project) {};

    service.getCollaborators = function(uuid) {};

    service.addCollaborator = function(uuid, username) {};

    service.projectData = function(uuid) {};

    return service;

  }]);
})(window, angular);
