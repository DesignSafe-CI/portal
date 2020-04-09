export function TicketsService($http, $q, djangoUrl) {
    'ngInject';
    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    function get(username) {
        return $http.get('/help/tickets?fmt=json')
            .then(function (resp) {
                return resp.data;
            });
    }
    return {
        get: get
    };

}
