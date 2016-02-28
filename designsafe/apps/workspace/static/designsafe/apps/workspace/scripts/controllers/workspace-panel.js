(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('WorkspacePanelCtrl',
    ['$scope', function($scope) {

    $scope.panel = {
      collapsed: false
    };

    $scope.togglePanel = function togglePanel() {
      $scope.panel.collapsed = ! $scope.panel.collapsed;
    };

  }]);
})(window, angular, jQuery);
