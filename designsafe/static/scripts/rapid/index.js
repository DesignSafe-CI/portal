import './styles/rapid.css';

import {mod as rapid_controllers} from './controllers';
import {mod as rapid_services} from './services';
import {mod as rapid_directives} from './directives';

import indexTemplate from './html/index.html';
import adminTemplate from './html/rapid-admin-users.html';

let mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ds.rapid.controllers', 'ds.rapid.services', 'ds.rapid.directives', 'ngAnimate');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode({
    enabled: true,
    rewriteLinks: false
  });

  $stateProvider.state('rapid', {
    url: '/',
    template: indexTemplate,
    controller: 'RapidMainCtrl as vm',
    resolve: {
      auth: function () {
        return true;
      }
    }
  })
  .state('rapid_admin', {
    url: '/admin/users',
    template: adminTemplate,
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
