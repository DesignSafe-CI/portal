(function(window, angular, $) {
  "use strict";

  function config($interpolateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  }

  angular.module('WorkspaceApp', ['ngCookies', 'ui.bootstrap', 'schemaForm']).config(config);
})(window, angular, jQuery);