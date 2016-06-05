(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('UserService', ['$http', '$q', 'djangoUrl', 'Logging', function($http, $q, djangoUrl, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.UserService');

    var service = {};

    /**
     * Search for users
     * @param {object} options
     * @param {string} options.q the query to search by
     * @returns {HttpPromise}
     */
    service.search = function (options) {
      return $http.get(djangoUrl.reverse('designsafe_api:user_search'), {params: {q: options.q}});
    };

    return service;
  }]);
})(window, angular, jQuery, _);
