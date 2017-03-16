import {mod as geo_directives} from './directives';
import {mod as geo_controllers} from './controllers';
import {mod as geo_services} from './services';

let mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ngDraggable', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services');

function config($stateProvider, $uibTooltipProvider) {
  'ngInject';
  $stateProvider.state('geo', {
    url: '',
    templateUrl: '/static/designsafe/apps/geo/html/map.html',
    controller: 'MapSidebarCtrl as vm',
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
