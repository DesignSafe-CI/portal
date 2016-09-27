(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('MyDataCtrl', ['$scope', '$state', 'Django', 'listing', function ($scope, $state, Django, listing) {

    $scope.data = {
      user: Django.user,
      listing: listing
    };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('myData', {systemId: listing.system, filePath: trailItem.path});
    };

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();
      $state.go('myData', {systemId: file.system, filePath: file.path});
    };

    $scope.onSelect = function($event, file) {
      $event.stopPropagation();
      file._ui = file._ui || {};
      file._ui.selected = ! file._ui.selected;
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
    };

  }]);
})(window, angular);
