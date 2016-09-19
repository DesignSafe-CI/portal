(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('SharedDataCtrl', ['$scope', '$location', '$state', '$stateParams', 'Django', 'DataService', function ($scope, $location, $state, $stateParams, Django, DataService) {

    $scope.data = {
      user: Django.user,
      listing: []
    };

    DataService.listPath({
      resource: 'agave',
      file_id: $stateParams.fileId
    }).then(function(resp) {
      $scope.data.listing = resp.data;
    });

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();
      $state.go('sharedData', {fileId: file.id});
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
