import './styles/geo.css';
import './styles/icons/style.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import { mod as geo_directives } from './directives';
import { mod as geo_controllers } from './controllers';
import { mod as geo_services } from './services';
import 'angular-native-dragdrop';
import indexTemplate from './html/index.html';
import mapTemplate from './html/map.html';
import helpTemplate from './html/help.html';



// let mod = angular.module('designsafe');
// mod.requires.push('ui.router', 'ang-drag-drop', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services', 'toastr');

let mod = angular.module('ds.geo', ['designsafe', 'ui.router', 'ang-drag-drop', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services', 'toastr']);
angular.module('designsafe.portal').requires.push(
    'ds.geo'
);

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
        template: indexTemplate,
        resolve: {
            auth: ['UserService', function (UserService) {
                return UserService.authenticate();
            }]
        }
    }).state('geo.map', {
        url: '/hazmapper',
        template: mapTemplate,
        controller: 'MapSidebarCtrl as vm'
    }).state('geo.help', {
        url: '/help',
        template: helpTemplate,
        controller: 'HelpCtrl as vm'
    });
    $urlRouterProvider.when('/', '/hazmapper');

    //config popups etc
    $uibTooltipProvider.options({ popupDelay:1000 });

}

mod.config(config);

export default mod;
