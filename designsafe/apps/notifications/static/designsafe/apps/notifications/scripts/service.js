(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').factory('notificationFactory', ['$http', 'djangoUrl', function($http, djangoUrl) {
    var service = {};

    service.list = function() {
      return $http.get(djangoUrl.reverse('designsafe_notifications:notifications', []));
    };

    service.delete = function(pk) {
      return $http.post(djangoUrl.reverse('designsafe_notifications:delete_notification', []), {'pk': encodeURIComponent(pk)});
    };

    return service;
  }]);

})(window, angular, jQuery, _);
