(function(window, angular, $) {
  'use strict';

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $stateProvider, $urlRouterProvider, toastrConfig) {

    angular.extend(toastrConfig, {
      positionClass: 'toast-bottom-left',
      timeOut: 5000,
      tapToDismiss: true,
    });

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('applications', {
          url:'/',
          templateUrl: '/static/designsafe/apps/applications/html/application-tray.html',
          controller: 'ApplicationTrayCtrl'
      })
      .state('applications-add-admin', {
          url: '/admin',
          templateUrl: '/static/designsafe/apps/applications/html/application-add-admin.html',
          controller: 'ApplicationAddCtrl'
      })
      .state('applications-add', {
          url: '/add',
          templateUrl: '/static/designsafe/apps/applications/html/application-add.html',
          controller: 'ApplicationAddCtrl'
      })
      .state('applications-edit', {
          url: '/edit/:appId',
          params: {appMeta: null},
          templateUrl: '/static/designsafe/apps/applications/html/application-edit.html',
          controller: 'ApplicationEditCtrl'
      })
      .state('applications-systems', {
          url: '/systems',
          templateUrl: '/static/designsafe/apps/applications/html/application-systems-role.html',
          controller: 'ApplicationSystemsRoleCtrl'
      });
  }

  var app = angular.module('designsafe');
  app.requires.push( 
    'django.context',
    'djng.urls',    //TODO: djng
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
})(window, angular, jQuery);
