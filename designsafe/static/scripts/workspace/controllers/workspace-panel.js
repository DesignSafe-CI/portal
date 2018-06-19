export function workspacePanelCtrl(window, angular, $) {
  "use strict";
  angular.module('designsafe').controller('WorkspacePanelCtrl',
    ['$scope', function($scope) {

    $scope.panel = {
      collapsed: false
    };

    $scope.togglePanel = function togglePanel() {
      $scope.panel.collapsed = ! $scope.panel.collapsed;
    };

    $scope.openPanel = function openPanel() {
      $scope.panel.collapsed = false;
    };

    $scope.$on('job-submitted', function(e, data) {
      $scope.openPanel();
    });



  }]);
}