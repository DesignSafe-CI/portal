export class UserService{

    constructor($http, $q) {
      'ngInject';
      this.$http = $http;
      this.$q = $q
      this.user = null;
    }


    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    get(username) {
      return this.$http.get("/api/users", {params: {username: username}})
        .then(resp => {
          return resp.data;
        });
    };

    /**
     * Get users by usernames
     * @param {array} users an array of usernames to look up
     * @returns {Promise}
     */
    getPublic(users) {
      return this.$http.get("/api/users/public/", {params: {usernames: JSON.stringify(users)}})
        .then(resp => {
          return resp.data;
        });
    };

    /**
     * Search for users
     * @param {object} options
     * @param {string} options.q the query to search by
     * @returns {Promise}
     */
    search(options) {
      return this.$http.get("/api/users", {params: {q: options.q, role:options.role}})
        .then(resp =>{
          return resp.data;
        });
    };

    /**
     * authenticate the current user on the backend, returning
     * a JSON  response with the oauth credentials for agave.
     * @returns {Promise}
     */
    authenticate() {
      return this.$http.get('/api/users/auth').then(resp => {
        this.user = resp.data;
        return resp.data;
      });
    };

    /**
      * Returns if the current user is even authenticated
      * @returns {boolean}
    */
    userAuthenticated() {
      return this.user ? true : false;
    };

    /**
      * Returns if the current user is even authenticated
      * @returns {object} currentUser
    */
    currentUser() {
      return this.user;
    };

    usage() {
      return this.$http.get('/api/users/usage/').then(resp => {
        return resp.data;
      });
    };

  }
