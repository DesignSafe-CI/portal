(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('UserService', ['$http', '$q', 'djangoUrl', 'Logging', function($http, $q, djangoUrl, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.UserService');

    var service = {};

    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    service.get = function (username) {
      return $http.get(djangoUrl.reverse('designsafe_api:user_search'), {params: {username: username}})
        .then(function (resp) {
          return resp.data;
        });
    };

    /**
     * Search for users
     * @param {object} options
     * @param {string} options.q the query to search by
     * @returns {Promise}
     */
    service.search = function (options) {
      return $http.get(djangoUrl.reverse('designsafe_api:user_search'), {params: {q: options.q}})
        .then(function (resp) {
          return resp.data;
        });
    };

    return service;
  }]);
})(window, angular, jQuery, _);
