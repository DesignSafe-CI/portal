//TODO: djng
angular.module('designsafe', ['ng.modernizr', 'djng.urls', 'slickCarousel']).config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}])

.constant('appCategories', ['Simulation', 'Visualization', 'Data Processing', 'Partner Data Apps', 'Utilities'])
// Current list of icons for apps
.constant('appIcons', ['Compress', 'Extract', 'MATLAB', 'Paraview', 'Hazmapper', 'Jupyter', 'ADCIRC', 'QGIS', 'LS-DYNA', 'LS-Pre/Post', 'VisIt', 'OpenFOAM', 'OpenSees'])

.run(['UserService', '$http', function (UserService, $http) {
  UserService.authenticate().then(function (resp) {
    $http.defaults.headers.common['Authorization'] = 'Bearer ' + resp.oauth.access_token;
  });
}]);
