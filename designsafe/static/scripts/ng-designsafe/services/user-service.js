angular.module('designsafe')
  .service('UserService', ['$http', '$q', 'djangoUrl', 'Logging', function($http, $q, djangoUrl, Logging) {

  var logger = Logging.getLogger('ngDesignSafe.UserService');

  var user = null;
  /**
   * Get user by username
   * @param {string} username the username of the user to look up
   * @returns {Promise}
   */
  this.get = function (username) {
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
  this.search = function (options) {
    return $http.get(djangoUrl.reverse('designsafe_api:user_search'), {params: {q: options.q}})
      .then(function (resp) {
        return resp.data;
      });
  };

  /**
   * authenticate the current user on the backend, returning
   * a JSON  response with the oauth credentials for agave.
   * @returns {Promise}
   */
   this.authenticate = function () {
     return $http.get('/api/users/auth').then(function (resp) {
       user = resp.data;
       return resp.data;
     });
   };

   /**
    * Returns if the current user is even authenticated
    * @returns {boolean}
    */
   this.userAuthenticated = function () {
     return user ? true : false;
   };

}]);
