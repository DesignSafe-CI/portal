(function(window, angular) {
  angular.module('ng.designsafe', ['djng.urls']).config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  }]);
})(window, angular);
