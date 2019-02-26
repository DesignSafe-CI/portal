export default class RapidAdminService {
    constructor ($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
    }

    update_permissions (user, action) {
        let payload = {
            username: user.username,
            action: action
        };

        return this.$http.post('/recon-portal/admin/users/permissions/', payload)
            .then( (resp)=>{
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }
}
