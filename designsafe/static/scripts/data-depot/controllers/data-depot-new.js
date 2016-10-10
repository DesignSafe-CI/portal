(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotNewCtrl', ['$scope', 'Django', 'ProjectService', 'DataBrowserService', function($scope, Django, ProjectService, DataBrowserService) {

    $scope.test = {
      enabled: Django.context.authenticated,
      createFiles: false,
      createProject: Django.context.authenticated
    };

    $scope.browser = DataBrowserService.state();

    $scope.$watch('browser.listing', function() {
      $scope.test.createFiles = false;
      if ($scope.browser.listing) {
        $scope.browser.listing.listPermissions().then(function (pems) {
          $scope.test.createFiles = _.findWhere(pems, {username: Django.user}).permission.write;
        });
      }
    });

    $scope.createFolder = function($event) {
      if ($scope.test.createFiles) {
        DataBrowserService.mkdir();
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    $scope.createProject = function($event) {
      if ($scope.test.createProject) {
        ProjectService.createProject();
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    $scope.uploadFiles = function($event) {
      if ($scope.test.createFiles) {
        DataBrowserService.upload(false);
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    $scope.uploadFolders = function($event) {
      if ($scope.test.createFiles) {
        DataBrowserService.upload(true);
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

  }]);


})(window, angular);
