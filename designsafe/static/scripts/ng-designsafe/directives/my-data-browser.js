angular.module('designsafe').directive('myDataBrowser', function () {
  return {
    restrict: 'E',
    scope: {
      file_only: '@file_only',
    },
    link: function ($scope, element, attrs) {
      console.log(element);
    },
    controller: ['$scope', 'DataBrowserService', 'UserService', 'FileListing', 'DataService',
    function ($scope, DataBrowserService, UserService, FileListing, DataService) {
      $scope.loading = true;
      $scope.data = {
        busyListingPage: true,
        wants: false
      };

      DataBrowserService.browse({system: 'designsafe.storage.default', path: 'jmeiring'}).then(function (resp) {
        $scope.data.busyListingPage = false;
        $scope.data.filesListing = resp;
      });


      $scope.getFileIcon = DataService.getIcon;

      $scope.displayName = function displayName(file) {
        if (file.systemId === 'nees.public') {
          if (file.name === '.' ) {
            return '..';
          } else {
            return file.projecTitle || file.name;
          }
        } else {
          if (file.name === '.' ) {
            return '..';
          } else {
            return file.name;
          }
        }
      };

      $scope.renderName = function(file){
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null ||
            _.isEmpty(file.metadata)){
          return file.name;
        }
        var pathComps = file.path.split('/');
        var experiment_re = /^experiment/;
        if (file.path[0] === '/' && pathComps.length === 2) {
          return file.metadata.project.title;
        }
        else if (file.path[0] !== '/' &&
                 pathComps.length === 2 &&
                 experiment_re.test(file.name.toLowerCase())){
          return file.metadata.experiments[0].title;
        }
        return file.name;
      };

    }],
    templateUrl: '/static/scripts/ng-designsafe/html/directives/my-data-browser.html'
  };
});
