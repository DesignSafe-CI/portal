export function UserService($http, $q) {
    'ngInject';

    var user = null;
    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    this.get = function (username) {
        return $http.get('/api/users', { params: { username: username } })
            .then(function (resp) {
                return resp.data;
            });
    };

    /**
     * Get users by usernames
     * @param {array} users an array of usernames to look up
     * @returns {Promise}
     */
    this.getPublic = function (users) {
        return $http.get('/api/users/public/', { params: { usernames: JSON.stringify(users) } })
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
        return $http.get('/api/users', { params: { q: options.q, role:options.role } })
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

    /**
      * Returns if the current user is even authenticated
      * @returns {object} currentUser
    */
    this.currentUser = function () {
        return user;
    };

    this.usage = function () {
        return $http.get('/api/users/usage/').then(function (resp) {
            return resp.data;
        });
    };

}
