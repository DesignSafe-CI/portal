(function(window, angular, $) {
  "use strict";

  function config($httpProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
  }

  angular.module('designsafe').requires.push(
    'ngCookies',
    'djng.urls',
    'ui.bootstrap',
    'designsafe',
    'django.context'
  );

  angular
    .module('designsafe')
    .config(['$httpProvider', '$locationProvider', config]);

})(window, angular, jQuery);
