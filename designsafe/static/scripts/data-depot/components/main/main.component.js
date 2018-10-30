export function MainCtrl($scope, DataBrowserService) {
    $scope.browser = DataBrowserService.state();
  }

export const MainComponent = {
    controller: MainCtrl
}