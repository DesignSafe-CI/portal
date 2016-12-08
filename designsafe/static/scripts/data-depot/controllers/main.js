(function(window, angular) {
  var app = angular.module('designsafe');
  app.controller('MainCtrl', ['$scope', 'DataBrowserService', function ($scope, DataBrowserService) {
    $scope.browser = DataBrowserService.state();
  }]);
})(window, angular);
