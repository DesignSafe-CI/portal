import {mod as geo_directives} from './directives';
import {mod as geo_controllers} from './controllers';
import {mod as geo_services} from './services';

let mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ang-drag-drop', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services', 'toastr');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider, toastrConfig) {
  'ngInject';

  angular.extend(toastrConfig, {
    timeOut: 1000
  });

  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider.state('geo', {
    url: '',
    abstract: true,
    templateUrl: '/static/designsafe/apps/geo/html/index.html',
    resolve: {
      auth: function () {
        return true;
      }
    }
  }).state('geo.map', {
    url: '/hazmapper',
    templateUrl: '/static/designsafe/apps/geo/html/map.html',
    controller: 'MapSidebarCtrl as vm'
  }).state('geo.help', {
    url: '/help',
    templateUrl: '/static/designsafe/apps/geo/html/help.html',
    controller: 'HelpCtrl as vm'
  });
  $urlRouterProvider.when('/', '/hazmapper');

  //config popups etc
  $uibTooltipProvider.options({popupDelay:1000});

}

mod.config(config);

export default mod;
