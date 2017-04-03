import {mod as rapid_controllers} from './controllers';
import {mod as rapid_services} from './services';
import {mod as rapid_directives} from './directives';

let mod = angular.module('designsafe');
mod.requires.push('ui.router','ds.rapid.controllers', 'ds.rapid.services', 'ds.rapid.directives');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode({
    enabled: true
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
  });
  //config popups etc
  $uibTooltipProvider.options({popupDelay:1000});

}

mod.config(config);



export default mod;
