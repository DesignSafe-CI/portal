import _ from 'underscore';
export function DataDepotNewCtrl($scope, $state, $sce, Django, ProjectService, DataBrowserService) {

    $scope.test = {
      enabled: Django.context.authenticated,
      createFiles: false,
      createProject: Django.context.authenticated
    };

    $scope.browser = DataBrowserService.state();

    $scope.$watch('browser.listing', function() {
      $scope.test.createFiles = false;
      if ($scope.browser.listing) {
        $scope.test.createFiles = $scope.browser.listing.permissions === 'ALL' ||
                                  $scope.browser.listing.permissions.indexOf('WRITE') > -1;
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
        ProjectService.editProject().then(function (project) {
          $state.go('projects.view.data', {projectId: project.uuid, filePath: '/'});
        });
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

    var popoverHTML = `
    <span>Our recommended method for bulk data transfer is <a href='https://www.designsafe-ci.org/rw/user-guides/globus-data-transfer-guide/'>using Globus.</a></span>
    `;
    
    $scope.popoverHTML = $sce.trustAsHtml(popoverHTML);

  }
