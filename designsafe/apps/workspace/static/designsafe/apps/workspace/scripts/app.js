(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider,  $stateProvider, $urlRouterProvider, toastrConfig) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    angular.extend(toastrConfig, {
      positionClass: 'toast-bottom-left',
      timeOut: 20000
    });

    WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
    );

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('tray', {
          url: '/:appId',
          templateUrl: '/static/designsafe/apps/workspace/html/main.html',
          controller: 'ApplicationTrayCtrl'
      })

  }

  angular.module('WorkspaceApp', [
    'ngCookies',
    'djng.urls',
    'ui.bootstrap',
    'ui.router',
    'schemaForm',
    'ng.designsafe',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'toastr',
    'dndLists',
    'xeditable',
    'pascalprecht.translate',
    'ngStorage'
  ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider',  '$stateProvider', '$urlRouterProvider', 'toastrConfig', config]);

  angular.module('WorkspaceApp')
    .run(['WSBusService', function init(WSBusService){
        WSBusService.init(WSBusService.url);
    }])
    .run(['NotificationService', function init(NotificationService){
        NotificationService.init();
    }])
    .run(function(editableOptions) {
      editableOptions.theme = 'bs3';
    });
})(window, angular, jQuery);
