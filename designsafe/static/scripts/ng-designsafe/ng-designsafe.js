(function(window, angular) {
  angular.module('designsafe', ['ng.modernizr', 'djng.urls']).config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }]);
})(window, angular);
