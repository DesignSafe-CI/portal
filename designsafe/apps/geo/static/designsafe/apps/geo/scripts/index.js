import MapSidebarCtrl from './controllers/map-sidebar';

let mod = angular.module('designsafe')
mod.requires.push('ui.router')

function config($stateProvider) {
  'ngInject';
  console.log('config')
  $stateProvider.state('geo', {
    url: '',
    templateUrl: '/static/designsafe/apps/geo/html/map.html',
    contoller: 'MapSidebarCtrl',
    resolve: {
      auth: function () {
        console.log('asdasdasd')
        return true;
      }
    }
  })

}

mod.config(config);
mod.controller('MapSidebarCtrl', MapSidebarCtrl);



export default mod;
