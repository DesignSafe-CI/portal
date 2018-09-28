export function MainCtrl($scope, DataBrowserService) {
    $scope.browser = DataBrowserService.state();
  }