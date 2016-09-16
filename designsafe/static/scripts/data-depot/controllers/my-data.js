(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('MyDataCtrl', ['$scope', '$location', '$stateParams', 'Django', 'DataService', function ($scope, $location, $stateParams, Django, DataService) {

    if (! $stateParams.fileId) {
      $stateParams.fileId = 'designsafe.storage.default/' + Django.user + '/';
      $location.path('/agave/' + $stateParams.fileId);
    }

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
      $stateParams.fileId = file.id;
      $location.path('/agave/' + $stateParams.fileId);
      DataService.listPath({
        resource: 'agave',
        file_id: $stateParams.fileId
      }).then(function(resp) {
        $scope.data.listing = resp.data;
      });
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
