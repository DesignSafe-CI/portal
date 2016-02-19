(function(window, angular, $, _) {
  "use strict";

  angular.module('NotificationList').factory('notificationFactory', ['$http', 'djangoUrl', function($http, djangoUrl) {
    var service = {};

    service.list = function() {
      return $http.get(djangoUrl.reverse('designsafe_notifications:notifications', []));
    };

    // service.delete = function(id) {
    //   return $http.post(djangoUrl.reverse('designsafe_notifications:delete_notification', []), params: {'id': encodeURIComponent(id)});
    // };

    return service;
  }]);

})(window, angular, jQuery, _);