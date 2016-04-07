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
    'toastr',
  ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

  angular.module('WorkspaceApp')
    .run(['WSBusService', 'logger', 'toastr', function init(WSBusService, logger, toastr){
        logger.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
        toastr.success('TESTING', 'workspace websockets init');
    }])
    .run(['NotificationService', function init(NotificationService){
        NotificationService.init();
    }]);
})(window, angular, jQuery);
