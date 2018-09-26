export function mainCtrl(window, angular) {
  var app = angular.module('ds-data');
  app.controller('MainCtrl', ['$scope', 'DataBrowserService', function ($scope, DataBrowserService) {
    $scope.browser = DataBrowserService.state();
  }]);
}
