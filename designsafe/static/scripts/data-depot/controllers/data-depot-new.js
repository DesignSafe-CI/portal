(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotNewCtrl', ['$scope', '$uibModal', 'DataBrowserService', function($scope, $uibModal, DataBrowserService) {

    $scope.createFolder = DataBrowserService.mkdir;

    $scope.createProject = function() {};

    $scope.uploadFiles = function() {};

    $scope.uploadFolders = function() {};

  }]);


})(window, angular);
