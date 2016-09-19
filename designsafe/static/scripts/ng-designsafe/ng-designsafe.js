(function(window, angular) {
  angular.module('ng.designsafe', ['ng.modernizr', 'djng.urls', 'ngSanitize', 'httpi'])
    .config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }]);
})(window, angular);
