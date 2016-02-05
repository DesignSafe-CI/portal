(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, $interpolateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    WSBusServiceProvider.setUrl('ws://' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/ws/job?subscribe-broadcast');
  }

  angular.module('WorkspaceApp', ['ngCookies', 'ng.django.urls', 'ui.bootstrap', 'schemaForm', 'ds.wsBus']).config(['WSBusServiceProvider', '$interpolateProvider', '$httpProvider', config]);

  angular.module('WorkspaceApp')
    .run(['WSBusService', function init(WSBusService){
        WSBusService.init(WSBusService.url);
        console.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
    }]);
})(window, angular, jQuery);