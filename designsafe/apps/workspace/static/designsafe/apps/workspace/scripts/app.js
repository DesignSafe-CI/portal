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
            '/ws/websockets?subscribe-broadcast'
    );
  }

  angular.module('WorkspaceApp', ['ngCookies', 'ng.django.urls', 'ui.bootstrap', 'schemaForm', 'ds.wsBus', 'ds.notifications']).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

  angular.module('WorkspaceApp')
    .run(['WSBusService', function init(WSBusService){
        console.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
    }])
    .run(['NotificationService', function init(NotificationService){
        console.log('workspace app.js running NotificationService')
        NotificationService.init();
    }]);
})(window, angular, jQuery);