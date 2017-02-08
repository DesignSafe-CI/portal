(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').service('searchService', ['$http', 'djangoUrl', function($http, djangoUrl) {

    this.search = function(text, limit, offset, type_filter) {
      limit = limit || 10;
      offset = offset || 0;
      console.log(type_filter)
      // return $http.get(djangoUrl.reverse('ds_search_api.search', []), {params: {'q': text}});
      return $http.get('/api/search',
        {params: {'q': text, 'limit': limit, 'offset': offset, 'type_filter': type_filter}}
      );
    };
    
  }]);

})(window, angular, jQuery, _);
