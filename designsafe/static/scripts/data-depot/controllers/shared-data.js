(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('SharedDataCtrl', ['$scope', '$state', 'Django', 'listing', function ($scope, $state, Django, listing) {

    $scope.data = {
      user: Django.user,
      listing: listing
    };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('sharedData', {systemId: listing.system, filePath: trailItem.path});
    };

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();

      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path === '/') {
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      $state.go('sharedData', {systemId: systemId, filePath: filePath});
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
