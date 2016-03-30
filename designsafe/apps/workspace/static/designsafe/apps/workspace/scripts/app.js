(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') +
            '/ws/websockets?subscribe-broadcast&subscribe-user'
        );
  }

  angular.module('WorkspaceApp', [
    'ngCookies',
    'ng.django.urls',
    'ui.bootstrap',
    'schemaForm',
    'ng.designsafe',
    'ds.wsBus',
    'ds.notifications',
    'logging',
  ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

  angular.module('WorkspaceApp')
    .run(['WSBusService', 'logger', function init(WSBusService, logger){
        logger.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
    }])
    .run(['NotificationService', function init(NotificationService){
        NotificationService.init();
    }]);
})(window, angular, jQuery);
