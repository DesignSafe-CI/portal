(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotToolbarCtrl', ['$scope', '$state', '$uibModal', 'Django', 'DataBrowserService', function ($scope, $state, $uibModal, Django, DataBrowserService) {

    $scope.browser = DataBrowserService.state();

    DataBrowserService.subscribe($scope, function($event, eventData) {
      if (eventData.type === DataBrowserService.FileEvents.FILE_SELECTION) {
        updateToolbar();
      }
    });

    $scope.tests = {};

    /**
     * Update the toolbar's status for various functions.
     */
    function updateToolbar() {
      $scope.tests = DataBrowserService.allowedActions($scope.browser.selected);
    }

    /* Set initial toolbar status */
    updateToolbar();

    /* Map service functions to toolbar buttons */
    $scope.ops = {
      details: function() {
        // preview the last selected file or current listing if none selected
        if ($scope.browser.selected.length > 0) {
          DataBrowserService.preview($scope.browser.selected.slice(-1)[0]);
        } else {
          DataBrowserService.preview($scope.browser.listing);
        }
      },
      download: function() {
        DataBrowserService.download($scope.browser.selected);
      },
      preview: function () {
        DataBrowserService.preview($scope.browser.selected[0]);
      },
      viewMetadata: function () {
        DataBrowserService.viewMetadata($scope.browser.selected[0]);
      },
      share: function () {
        DataBrowserService.share($scope.browser.selected[0]);
      },
      copy: function () {
        DataBrowserService.copy($scope.browser.selected);
      },
      move: function () {
        DataBrowserService.move($scope.browser.selected);
      },
      rename: function () {
        DataBrowserService.rename($scope.browser.selected[0]);
      },
      trash: function () {
        DataBrowserService.trash($scope.browser.selected);
      },
      rm: function () {
        DataBrowserService.rm($scope.browser.selected);
      }
    }


  }]);
})(window, angular);
