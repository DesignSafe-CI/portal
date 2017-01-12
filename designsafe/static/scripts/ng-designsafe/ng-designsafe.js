angular.module('designsafe', ['ng.modernizr', 'djng.urls', 'slickCarousel']).config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]).run(['UserService', '$http', function (UserService, $http) {
  console.log(UserService);
  UserService.authenticate().then(function (resp) {
    console.log(resp);
    $http.defaults.headers.common['Authorization'] = 'Bearer ' + resp.oauth.access_token;
  });
}]);
