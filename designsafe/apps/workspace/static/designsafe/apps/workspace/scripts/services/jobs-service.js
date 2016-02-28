(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Jobs', ['$http', 'djangoUrl', function($http, djangoUrl) {
    var service = {};

    service.list = function() {
      return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']));
    };

    service.get = function(uuid) {
      return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
        params: {'job_id': uuid}
      });
    };

    service.submit = function(data) {
      return $http.post(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), data);
    };

    return service;
  }]);
})(window, angular, jQuery, _);
