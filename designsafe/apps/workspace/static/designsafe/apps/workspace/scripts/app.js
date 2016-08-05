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
    'djng.urls',
    'ui.bootstrap',
    'schemaForm',
    'ng.designsafe',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'toastr',
    'dndLists',
    'xeditable',
    'pascalprecht.translate',
  ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

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
