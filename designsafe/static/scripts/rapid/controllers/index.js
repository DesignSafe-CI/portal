import RapidMainCtrl from './rapid-main-ctrl';
import RapidAdminUsersCtrl from './rapid-admin-users-ctrl';


let mod = angular.module('ds.rapid.controllers', []);

mod.controller('RapidMainCtrl', RapidMainCtrl);
mod.controller('RapidAdminUsersCtrl', RapidAdminUsersCtrl);
