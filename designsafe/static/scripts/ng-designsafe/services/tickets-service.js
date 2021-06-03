export default function TicketsService($http, $q, djangoUrl) {
    'ngInject';

    /**
     * Get user by username
     * @param {string} username the username of the user to look up
     * @returns {Promise}
     */
    function get(username) {
        return $http.get('/help/tickets?fmt=json').then((resp) => {
            return resp.data;
        });
    }
    function feedback(formData) {
        return $http.post('/help/feedback', formData).then((resp) => {
            return resp.data;
        });
    }
    return {
        get,
        feedback,
    };
}
