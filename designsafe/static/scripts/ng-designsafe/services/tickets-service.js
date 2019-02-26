export function TicketsService($http, $q, djangoUrl) {
    'ngInject';
    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    function get(username) {
      return $http.get('/help/tickets?fmt=json')
        .then((resp) => {
          return resp.data;
        },
        (error) => {
            return this.$q.reject(error);
        });
    };
    return {
        get: get
    };

  }
