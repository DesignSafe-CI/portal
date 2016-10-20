(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('MyDataCtrl', ['$scope', '$state', 'Django', 'listing', function ($scope, $state, Django, listing) {
    $scope.data = {
      user: Django.user,
      listing: listing
    };

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();
      $state.go('myData', { fileId: file.id });
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
