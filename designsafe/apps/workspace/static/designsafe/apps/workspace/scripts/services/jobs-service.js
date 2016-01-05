(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Jobs', ['$http', function($http) {
    var service = {};

    service.list = function() {};

    service.get = function(uuid) {};

    service.submit = function() {};

    return service;
  });
})(window, angular, jQuery, _);