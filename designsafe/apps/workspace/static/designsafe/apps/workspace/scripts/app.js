(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $urlRouterProvider, $stateProvider) {

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

  angular.module('designsafe').requires.push(
    'ngCookies',
    'djng.urls',  //TODO: djng
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
  angular.module('designsafe').config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', '$urlRouterProvider', '$stateProvider', config]);

  angular.module('designsafe')
    .run(function(editableOptions) {
      editableOptions.theme = 'bs3';
    });
})(window, angular, jQuery);
