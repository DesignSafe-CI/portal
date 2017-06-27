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

   return this.$http.post('/rapid/admin/users/permissions', payload).then( (resp)=>{
     return resp.data;
   });
  }
}
