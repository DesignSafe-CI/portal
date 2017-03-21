angular.module('designsafe').directive('myDataBrowser',  ['DataBrowserService', 'UserService', 'FileListing', 'DataService',
function (DataBrowserService, UserService, FileListing, DataService) {
  return {
    restrict: 'E',
    scope: {
      filepicker: '@filepicker',
      selected: '=selected',
    },
    templateUrl: '/static/scripts/ng-designsafe/html/directives/my-data-browser.html',
    controller: function ($scope) {
      console.log($scope.filepicker);
    },
    link: function ($scope, element, attrs) {
      console.log($scope.filepicker);
      $scope.data = {
        busyListingPage: true,
        wants: false,
        loading: true
      };

      DataBrowserService.browse({system: 'designsafe.storage.default', path: 'jmeiring'}).then(function (resp) {
        $scope.data.busyListingPage = false;
        $scope.data.filesListing = resp;
        $scope.data.loading = false;
      }, function (err) {
        $scope.data.loading = false;
      });


      $scope.getFileIcon = DataService.getIcon;

      $scope.browseFile = function(file){
        if (file.type !== 'folder' && file.type !== 'dir'){
          return;
        }
        $scope.data.filesListing = null;
        $scope.data.loading = true;
        DataBrowserService.browse(file)
          .then(function(listing) {
            $scope.data.filesListing = listing;
            if ($scope.data.filesListing.children.length > 0){
              $scope.data.filePath = $scope.data.filesListing.path;
              $scope.data.dirPath = $scope.data.filePath.split('/');
              $scope.browser.listing = $scope.data.filesListing;
            }
            $scope.data.loading = false;
          }, function(err){
            logger.log(err);
            $scope.data.error = 'Unable to list the selected data source: ' + error.statusText;
            $scope.data.loading = false;
          });
      };

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

    },
  };
}]);
