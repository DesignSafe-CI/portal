export function notificationFactory($http, djangoUrl) {
      var service = {};

      service.list = function() {
        return $http.get(djangoUrl.reverse('designsafe_api:index', []));
      };

      service.delete = function(pk) {
        return $http.delete(djangoUrl.reverse('designsafe_api:delete_notification', {'pk': encodeURIComponent(pk)}));
      };

      return service;
    }
  