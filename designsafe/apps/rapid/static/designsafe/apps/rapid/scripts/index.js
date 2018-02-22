import {mod as rapid_controllers} from './controllers';
import {mod as rapid_services} from './services';
import {mod as rapid_directives} from './directives';
import './../../../../../../../static/styles/base.scss';

let mod = angular.module('designsafe');
mod.requires.push('ui.router','ds.rapid.controllers', 'ds.rapid.services', 'ds.rapid.directives', 'ngAnimate');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode({
    enabled: true,
    rewriteLinks: false
  });

  $stateProvider.state('rapid', {
    url: '/',
    templateUrl: '/static/designsafe/apps/rapid/html/index.html',
    controller: 'RapidMainCtrl as vm',
    resolve: {
      auth: function () {
        return true;
      }
    }
  })
  .state('rapid_admin', {
    url: '/admin/users',
    templateUrl: '/static/designsafe/apps/rapid/html/rapid-admin-users.html',
    controller: 'RapidAdminUsersCtrl as vm',
    resolve: {
      auth: function () {
        return true;
      }
    }
  });

  //config popups etc
  $uibTooltipProvider.options({popupDelay:1000});

}

mod.config(config);



export default mod;
