/**
 * Created by mrhanlon on 4/28/16.
 */
(function(window, angular, $) {
  "use strict";

  function config($httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $locationProvider.html5Mode(true);
  }

  angular.module('DataDepotBrowser', [
    'ngCookies',
    'ng.django.urls',
    'ui.bootstrap',
    'ng.designsafe',
    'django.context'
  ]).config(['$httpProvider', '$locationProvider', config]);

})(window, angular, jQuery);
