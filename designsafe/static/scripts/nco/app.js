import angular from 'angular';

import './components';

let ncoModule = angular.module('nco', ['designsafe', 'nco.components']);
ncoModule.requires.push(
    'ui.router',
    'ui.bootstrap',
    'django.context',
    'ds.notifications',
    'ds.wsBus',
    'toastr',
    'logging',
    'ui.customSelect',
    'ngSanitize'
);
angular.module('designsafe.portal').requires.push('nco');


/**
 * @function
 * @param {Object} $httpProvider
 * @param {Object} $locationProvider
 * @param {Object} $stateProvider
 * @param {Object} $urlRouterProvider
 * @param {Object} Django
 * @param {Object} toastrConfig
 */
function config(
    $httpProvider,
    $locationProvider,
    $stateProvider,
    $urlRouterProvider,
    $urlMatcherFactoryProvider,
    Django,
    toastrConfig
) {
    'ngInject';

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left',
        timeOut: 20000,
    });

    $stateProvider
        .state('nco', {
            url: '/nco',
            template: '<pre>local/trainingMaterials.html</pre>',
        });
}

ncoModule
    .config([
        '$httpProvider',
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$urlMatcherFactoryProvider',
        'Django',
        'toastrConfig',
        config,
    ]);

ncoModule.config([
    'WSBusServiceProvider',
    function(WSBusServiceProvider) {
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
                window.location.hostname +
                (window.location.port ? ':' + window.location.port : '') +
                '/ws/websockets/?subscribe-broadcast&subscribe-user'
        );
    },
]);
export default ncoModule;
