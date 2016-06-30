(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $stateProvider, $urlRouterProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') +
            '/ws/websockets?subscribe-broadcast&subscribe-user'
        );

    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('applications', {
          url:"/",
          templateUrl: "/static/designsafe/apps/applications/html/application-tray.html",
          controller: "ApplicationTrayCtrl"
      })
      .state('applications-add', {
          url: "/add",
          templateUrl: "/static/designsafe/apps/applications/html/application-add.html",
          controller: "ApplicationAddCtrl"
      })
      .state('applications-edit', {
          url: "/edit/:appId",
          params: {appMeta: null},
          templateUrl: "/static/designsafe/apps/applications/html/application-edit.html",
          controller: "ApplicationEditCtrl"
      })
  }

  var app = angular.module('ApplicationsApp', [
    'django.context',
    'djng.urls',
    'dndLists',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'ngCookies',
    'ng.designsafe',
    'pascalprecht.translate',
    'schemaForm',
    'schemaFormWizard',
    'toastr',
    'ui.bootstrap',
    'ui.router',
    'ui.codemirror',
    'xeditable',
  ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', '$stateProvider', '$urlRouterProvider', config]);


  app.run(['WSBusService', 'logger', function init(WSBusService, logger){
        logger.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
    }])
    .run(['NotificationService', function init(NotificationService){
        NotificationService.init();
    }])
    .run(function(editableOptions) {
      editableOptions.theme = 'bs3';
    });
})(window, angular, jQuery);
