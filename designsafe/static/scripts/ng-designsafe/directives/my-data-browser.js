angular.module('designsafe').directive('myDataBrowser',  ['DataBrowserService', 'UserService', 'FileListing', 'DataService',
function (DataBrowserService, UserService, FileListing, DataService) {
  return {
    restrict: 'E',
    scope: {
      picker: '@picker',
      selected: '=selected'
    },
    templateUrl: '/static/scripts/ng-designsafe/html/directives/my-data-browser.html',
    link: function ($scope, element, attrs) {
      $scope.picker = $scope.picker || 'all';
      $scope.data = {
        busyListingPage: true,
        wants: false,
        loading: true,
        systemsList: [],
        system: 'designsafe.storage.default',
        dirPath: [],
        filePath: '',
      };
      $scope.selected = null;

      DataBrowserService.browse({system: $scope.data.system}).then(function (resp) {
        $scope.data.filesListing = resp;
        $scope.data.loading = false;
        $scope.data.filePath = $scope.data.filesListing.path;
        $scope.data.dirPath = $scope.data.filePath.split('/');
      }, function (err) {
        $scope.data.loading = false;
      });

      $scope.selectRow = function (file, idx) {
        $scope.data.filesListing.children.forEach(function (d) {
          d.selected = false;
        });
        if ($scope.picker === 'file' && file.type !== 'folder' && file.type !== 'dir') {
            file.selected = true;
            $scope.selected = file;
        } else if ($scope.picker === 'folder' && (file.type !== 'folder' || file.type !== 'dir')) {
          file.selected = true;
          $scope.selected = file;
        } else if ($scope.picker === 'all') {
          file.selected = true;
          $scope.selected = file;
        }
      };
      $scope.getFileIcon = DataService.getIcon;

      $scope.browseTrail = function($event, index){
        $event.stopPropagation();
        $event.preventDefault();
        if ($scope.data.dirPath.length <= index+1){
          return;
        }
        $scope.browseFile({type: 'dir',
                           system: $scope.data.filesListing.system,
                           resource: $scope.data.filesListing.resource,
                           path: $scope.data.dirPath.slice(0, index+1).join('/')});
      };

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
              // $scope.browser.listing = $scope.data.filesListing;
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
