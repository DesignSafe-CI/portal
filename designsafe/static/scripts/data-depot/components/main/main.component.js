export function MainCtrl($scope, DataBrowserService) {
    'ngInject';
    $scope.browser = DataBrowserService.state();
  }

export const MainComponent = {
    controller: MainCtrl
}