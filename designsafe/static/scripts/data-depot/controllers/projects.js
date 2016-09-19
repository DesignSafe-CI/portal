(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('ProjectListingCtrl', ['$scope', '$state', 'Django', 'ProjectService', function ($scope, $state, Django, ProjectService) {

    $scope.data = {
      columns: [
        {
          key: 'value.title',
          label: 'Name',
          defaultValue: 'Please provide'
        },
        {
          key: 'value.pi',
          label: 'PI',
          defaultValue: 'Please provide'
        },
        {
          key: 'created',
          label: 'Created'
        }
      ]
    };

    ProjectService.list().then(function(projects) {
      $scope.data.projects = projects;
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('myProjects.view', {projectId: project.uuid});
    };

  }]);

  app.controller('ProjectViewCtrl', ['$scope', 'Django', 'ProjectService', 'projectId', function ($scope, Django, ProjectService, projectId) {

    $scope.data = {};

    ProjectService.get({uuid: projectId}).then(function(project) {
      $scope.data.project = project;
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
    };

  }]);
})(window, angular);
