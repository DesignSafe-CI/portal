export function notificationFactory($http) {
    'ngInject';
      var service = {};

      service.list = function() {
        return $http.get('/api/notifications/');
      };

      service.delete = function(pk) {
        return $http.delete(`/api/notifications/delete/${encodeURIComponent(pk)}`);
      };

      return service;
    }

