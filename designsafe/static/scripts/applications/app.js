
import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

import './services/apps-wizard-service';

import { applicationAddCtrl } from './controllers/application-add';
import { applicationEditCtrl } from './controllers/application-edit';
import { applicationSystemsRoleCtrl } from './controllers/application-systems-role';
import { applicationTrayCtrl } from './controllers/application-tray';

import { toTrusted } from './filters/sanitize';

import { appTranslateProvider } from './providers/translations';

import { appsPemsService } from './services/apps-pems-service';
import { Apps } from './services/apps-service';
import { appsMultipleListService } from './services/multiple-list-service';
import { SimpleList } from './services/simple-list-service';

applicationAddCtrl(window, angular, $, _);
applicationEditCtrl(window, angular, $, _);
applicationSystemsRoleCtrl(window, angular, $, _);
applicationTrayCtrl(window, angular, $, _);
toTrusted(window, angular, $, _);
appTranslateProvider(angular);
appsPemsService(window, angular, $, _);
appsMultipleListService(window, angular, $, _);

angular.module('designsafe')
    .factory('SimpleList', ['$http', '$q', 'djangoUrl', 'appIcons', ($http, $q, djangoUrl, appIcons) => new SimpleList($http, $q, djangoUrl, appIcons)])
    .service('Apps', Apps);

function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $stateProvider, $urlRouterProvider, toastrConfig) {
    'ngInject';
    angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left',
        timeOut: 5000,
        tapToDismiss: true,
    });

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('applications', {
            url: '/',
            template: require('./html/application-tray.html'),
            controller: 'ApplicationTrayCtrl',
        })
        .state('applications-add-admin', {
            url: '/admin',
            template: require('./html/application-add-admin.html'),
            controller: 'ApplicationAddCtrl',
        })
        .state('applications-add', {
            url: '/add',
            template: require('./html/application-add.html'),
            controller: 'ApplicationAddCtrl',
        })
        .state('applications-edit', {
            url: '/edit/:appId',
            params: { appMeta: null },
            template: require('./html/application-edit.html'),
            controller: 'ApplicationEditCtrl',
        })
        .state('applications-systems', {
            url: '/systems',
            template: require('./html/application-systems-role.html'),
            controller: 'ApplicationSystemsRoleCtrl',
        });
}

let app = angular.module('designsafe');
app.requires.push(
    'django.context',
    'djng.urls', // TODO: djng
    'dndLists',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'ngCookies',
    'pascalprecht.translate',
    'schemaForm',
    'schemaFormWizard',
    'toastr',
    'ui.bootstrap',
    'ui.router',
    'ui.codemirror',
    'xeditable'
);
app.config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', '$stateProvider', '$urlRouterProvider', 'toastrConfig', config]);

app.run(function(editableOptions) {
    editableOptions.theme = 'bs3';
});

