(function(window, angular) {
  angular.module('ng.designsafe', ['ng.django.urls']).config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  }]);
})(window, angular);
