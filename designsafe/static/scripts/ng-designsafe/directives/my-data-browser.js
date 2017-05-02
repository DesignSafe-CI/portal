angular.module('designsafe').directive('myDataBrowser',  ['DataBrowserService', 'UserService', 'FileListing', 'DataService', 'ProjectService',
function (DataBrowserService, UserService, FileListing, DataService, ProjectService) {
  return {
    restrict: 'E',
    scope: {
      picker: '@picker',
      selected: '=selected',
      saveas: '=saveas'
    },
    templateUrl: '/static/scripts/ng-designsafe/html/directives/my-data-browser.html',
    link: function ($scope, element, attrs) {
      $scope.picker = $scope.picker || 'all';
      $scope.data = {
        busyListingPage: true,
        filesListing: null,
        wants: false,
        loading: false,
        systemsList: [],
        system: 'designsafe.storage.default',
        dirPath: [],
        filePath: '',
        source: 'mydata',
        selectedProject: null
      };

      $scope.selected = null;

      $scope.listProjects = function () {
        $scope.data.loading=true;
        $scope.data.selectedProject = null;
        ProjectService.list().then( function (resp) {
          console.log(resp)
          $scope.project_list = resp;
          $scope.data.loading = false;
          $scope.data.projectSelected = false;
        });
      };

      $scope.selectProject = function (project) {
        $scope.data.system = 'project-' + project.uuid;
        $scope.data.filePath = '/';
        $scope.data.projectSelected = true;
        $scope.data.selectedProject = project;
        $scope.browse();
      };

      $scope.browse = function () {
        $scope.data.loading = true;
        DataBrowserService.browse({system: $scope.data.system, path:$scope.data.filePath}).then(function (resp) {
          $scope.data.filesListing = resp;
          $scope.selected = resp;
          $scope.data.loading = false;
          $scope.data.filePath = $scope.data.filesListing.path;
          $scope.data.dirPath = $scope.data.filePath.split('/');
        }, function (err) {
          $scope.data.loading = false;
        });
      };
      $scope.browse();

      $scope.setSource = function (src) {
        $scope.data.source = src;

        if ($scope.data.source === 'myprojects') {
          $scope.data.filesListing = null;
          $scope.data.dirPath = [];
          $scope.listProjects();
        } else {
          $scope.data.selectedProject = null;
          $scope.data.system = 'designsafe.storage.default';
          $scope.project_list = null;
          $scope.browse();
        }
      };

      $scope.selectRow = function (file, idx) {
        $scope.data.filesListing.children.forEach(function (d) {
          d.selected = false;
        });
        if ($scope.picker === 'file' && file.type !== 'folder' && file.type !== 'dir') {
            file.selected = true;
            $scope.selected = file;
            if ($scope.saveas.filename) {
              $scope.saveas.filename = file.name;
            }
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
