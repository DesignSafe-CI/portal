(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').factory('searchFactory', ['$http', 'djangoUrl', function($http, djangoUrl) {
    var service = {};

    service.search = function(text, limit, offset) {
      limit = limit || 10;
      offset = offset || 0;
      // return $http.get(djangoUrl.reverse('ds_search_api.search', []), {params: {'q': text}});
      return $http.get('/api/search', {params: {'q': text, 'limit': limit, 'offset': offset}});
    };

    return service;
  }]);

})(window, angular, jQuery, _);
