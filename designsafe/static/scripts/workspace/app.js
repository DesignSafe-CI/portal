import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';


import { agaveFilePicker } from '../workspace/directives/agave-file-picker';
import { translateProvider } from '../workspace/providers/translations';

import './directives';
import './services';
import './components';
import './controllers';


let workspaceModule = angular.module(
    'workspace', [
        'workspace.directives',
        'workspace.services',
        'workspace.components',
        'workspace.controllers',
    ]
);

/** Config function to setup module
 *
 * @param {Object} WSBusServiceProvider
 * @param {Object} NotificationServiceProvider
 * @param {Object} $interpolateProvider
 * @param {Object} $httpProvider
 * @param {Object} $urlRouterProvider
 * @param {Object} $stateProvider
 */
function config(
    WSBusServiceProvider,
    NotificationServiceProvider,
    $interpolateProvider,
    $httpProvider,
    $urlRouterProvider,
    $stateProvider
) {
    WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
    );

    $urlRouterProvider.otherwise('/');

    $stateProvider.state(
        'tray', {
            url: '/:appId',
            component: 'apptray',
        }
    );
}

agaveFilePicker(window, angular, $, _);
translateProvider(angular);

angular.module('workspace').requires.push(
    'ngCookies',
    'ui.bootstrap',
    'ui.router',
    'schemaForm',
    'designsafe',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'dndLists',
    'xeditable',
    'pascalprecht.translate',
    'ngStorage',
    'ngMaterial',
    'django.context'
);

angular.module('workspace').config([
    'WSBusServiceProvider',
    'NotificationServiceProvider',
    '$interpolateProvider',
    '$httpProvider',
    '$urlRouterProvider',
    '$stateProvider',
    config,
]);

angular.module('workspace')
    .run(function(editableOptions) {
        editableOptions.theme = 'bs3';
    });
export default workspaceModule;
angular.module('designsafe.portal').requires.push(
    'workspace'
);
