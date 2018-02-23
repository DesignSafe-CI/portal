angular.module('designsafe').directive('myDataBrowser',  ['DataBrowserService', 'UserService', 'FileListing', 'ProjectService',
function (DataBrowserService, UserService, FileListing, ProjectService) {
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
          $scope.project_list = resp;
          $scope.data.loading = false;
          $scope.data.projectSelected = false;
        });
      };

      $scope.listPublished = function () {
        $scope.data.loading=true;
        $scope.data.selectedPublished = null;
        $http.get("/api/public/files/listing/published/").then(function (resp) {
          console.log(resp);
          $scope.published_list = resp.data;
          $scope.data.publishedSelected = false;
        });
      };

      $scope.selectPublished = function (pub) {
        $scope.data.system = pub.meta.system;
        $scope.data.filePath = '/';
        $scope.data.publishedSelected = true;
        $scope.data.selectedPublished = pub;
        $scope.selected = pub;
        $scope.browse();
      };

      $scope.selectProject = function (project) {
        $scope.data.system = 'project-' + project.uuid;
        $scope.data.filePath = '/';
        $scope.data.projectSelected = true;
        $scope.data.selectedProject = project;
        $scope.selected = project;
        $scope.browse();
      };

      $scope.browse = function () {
        $scope.data.loading = true;
        console.log($scope.data)
        DataBrowserService.browse({system: $scope.data.system, path:$scope.data.filePath}).then(function (resp) {
          console.log(resp)
          $scope.data.filesListing = resp;
          $scope.selected = resp;
          $scope.data.loading = false;
          $scope.data.filePath = $scope.data.filesListing.path;
          $scope.data.dirPath = $scope.data.filePath.split('/');
        }, function (err) {
          $scope.data.loading = false;
        });
      };


      // If there was a previous listing, bring them back to that place...
      if (DataBrowserService.state().listing) {
        $scope.data.system = DataBrowserService.state().listing.system;
        $scope.data.filePath = DataBrowserService.state().listing.path;
        $scope.data.dirPath = $scope.data.filePath.split('/');
        if ($scope.data.system.startsWith('project')) {
          $scope.data.source = 'myprojects';
          $scope.data.projectSelected = true;
          var project_uuid = $scope.data.system.replace("project-", '');
          ProjectService.get({uuid:project_uuid}).then(function (resp) {
            $scope.data.selectedProject = resp;
          });

        } else if ($scope.data.system === 'designsafe.storage.default') {
          $scope.data.source = 'mydata';
        } else if (DataBrowserService.apiParams.fileMgr === 'community'){
          $scope.data.source = 'community';
        } else {
          $scope.data.source = 'public';
        }
      }

      $scope.browse();

      $scope.setSource = function (src) {
        $scope.data.source = src;
        $scope.selected = null;
        if ($scope.data.source === 'myprojects') {
          DataBrowserService.apiParams.fileMgr = 'agave';
          DataBrowserService.apiParams.baseUrl = '/api/agave/files';
          $scope.data.filesListing = null;
          $scope.data.dirPath = [];
          $scope.listProjects();
        } else if  ($scope.data.source == 'community') {
          DataBrowserService.apiParams.fileMgr = 'community';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          $scope.data.filesListing = null;
          $scope.data.filePath = '/';
          $scope.data.selectedProject = null;
          $scope.data.system = 'designsafe.storage.community';
          $scope.project_list = null;
          $scope.browse();
        } else if  ($scope.data.source == 'public') {
          DataBrowserService.apiParams.fileMgr = 'public';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          $scope.data.system = 'nees.public';
          $scope.data.filePath = '/';
          $scope.data.filesListing = null;
          $scope.project_list = null;
          $scope.browse();
        } else {
          DataBrowserService.apiParams.fileMgr = 'agave';
          DataBrowserService.apiParams.baseUrl = '/api/agave/files';
          $scope.data.filesListing = null;
          $scope.data.filePath = '';
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
            $scope.selected = listing;
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
