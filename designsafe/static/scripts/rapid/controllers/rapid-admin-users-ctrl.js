
export default class RapidAdminUsersCtrl {

  constructor(UserService, RapidAdminService) {
    'ngInject';
    this.UserService = UserService;
    this.RapidAdminService = RapidAdminService;
    this.list_admin_users();

  }

  list_admin_users () {
    this.UserService.search({q:'', role:'Rapid Admin'}).then( (resp)=>{
      this.admin_users = resp;
    });
  }

  search_users(q) {
    if (q.length > 1) {
      this.UserService.search({q:q}).then((resp)=>{
        console.log(resp);
        this.found_users = resp;
      });
    } else {
      this.found_users = [];
    }
  }

  make_admin(user) {
    this.RapidAdminService.update_permissions(user, 'grant').then( (resp)=>{
      this.list_admin_users();
    });
  }

  revoke_admin(user) {
    this.RapidAdminService.update_permissions(user, 'revoke').then( (resp)=>{
      this.list_admin_users();
    });
  }
}
