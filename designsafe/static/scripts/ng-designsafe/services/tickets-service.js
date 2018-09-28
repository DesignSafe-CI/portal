export function TicketsService($http, $q, djangoUrl) {

    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    this.get = function (username) {
      return $http.get('/help/tickets?fmt=json')
        .then(function (resp) {
          return resp.data;
        });
    };


  }