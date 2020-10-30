import angular from 'angular';

import { agave2ds } from './filters/filters';
// import { DSTSBarChart } from './charts/DSTSBarChart';
import { appsService } from '../workspace/services/apps-service';
import { jobsService } from '../workspace/services/jobs-service';
import { UserService } from '../ng-designsafe/services/user-service';
import { TicketsService } from '../ng-designsafe/services/tickets-service';
import { NotificationServiceProvider } from '../ng-designsafe/providers/notifications-provider';

import './components';

agave2ds();

let dashboardServices = angular.module('dashboard.services', ['toastr', 'djng.urls']);
dashboardServices.factory('Apps', appsService);
dashboardServices.factory('Jobs', jobsService);
dashboardServices.service('UserService', UserService);
dashboardServices.service('TicketsService', TicketsService);
dashboardServices.provider('NotificationService', NotificationServiceProvider);

dashboardServices.config(['$translateProvider', function($translateProvider) {
    'ngInject';
    $translateProvider.translations('en', {
        error_system_monitor: 'The execution system for this app is currently unavailable. Your job submission may fail.',
        error_app_run: 'Could not find appId provided',
        error_app_disabled: "The app you're trying to run is currently disabled. Please enable the app and try again",
        apps_metadata_name: 'ds_apps',
        apps_metadata_list_name: 'ds_apps_list',
    });
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escape');
}]);
dashboardServices.requires.push(
    'pascalprecht.translate'
);

let dashboardModule = angular.module('dashboard', [
    'dashboard.components',
    'dashboard.services',
]);


dashboardModule.requires.push(
    'ui.router',
    'djng.urls', // TODO: djng
    'ui.bootstrap',
    'django.context'
);

angular.module('designsafe.portal').requires.push(
    'dashboard'
);


function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django, $translateProvider) {
    'ngInject';
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    $stateProvider
        /* Private */
        .state('dashboard', {
            url: '/',
            component: 'db',
            resolve: {
                auth: ['UserService', function(UserService) {
                    return UserService.authenticate();
                }],
            },
        });
}

dashboardModule.config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', config]);

export default dashboardModule;
