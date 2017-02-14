import MapSidebarCtrl from './controllers/map-sidebar';

let mod = angular.module('designsafe')
mod.requires.push('ui.router')

function config($stateProvider) {
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
  })

}

mod.config(config);
mod.controller('MapSidebarCtrl', MapSidebarCtrl);



export default mod;
