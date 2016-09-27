(function(window, angular) {
  var app = angular.module('DataDepotApp');

  app.controller('ProjectRootCtrl', ['$scope', '$state', function ($scope, $state) {

    $scope.data = {
      navItems: []
    };

    $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
      $scope.data.navItems = [{href: false, label: 'Projects'}];

      if (toState.name !== 'projects.list') {
        $scope.data.navItems[0].href = $state.href('projects.list');
      }

      if (toState.name === 'projects.view') {
        $scope.data.navItems.push({
          label: toStateParams.projectId,
          href: $state.href('projects.view', {projectId: toStateParams.projectId}),
        });
      } else if (toState.name === 'projects.viewData') {
        $scope.data.navItems.push({
          label: toStateParams.projectId,
          href: $state.href('projects.view', {projectId: toStateParams.projectId}),
        });

        // TODO build this for each path component
        _.each(toStateParams.filePath.split('/'), function(e, i, l) {
          $scope.data.navItems.push({
            label: e,
            href: $state.href('projects.viewData', {
              projectId: toStateParams.projectId,
              filePath: l.slice(0, i + 1).join('/')
            })
          });
        });
      }
    });
  }]);

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
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('projects.view', {projectId: project.uuid});
    };

  }]);

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataService', 'projectId', 'filePath', function ($scope, $state, Django, ProjectService, DataService, projectId, filePath) {

    $scope.data = {};

    ProjectService.get({uuid: projectId}).then(function(project) {
      $scope.data.project = project;
    });

    ProjectService.projectData({
      uuid: projectId,
      fileId: filePath
    }).then(function(resp) {
      $scope.data.listing = resp.data;
      $scope.data.listing.href = $state.href('projects.viewData', {
        projectId: projectId,
        filePath: $scope.data.listing.path.split('/').slice(2).join('/')
      });
      $scope.data.listing.children = _.map($scope.data.listing.children, function(f) {
        f.href = $state.href('projects.viewData', {projectId: projectId, filePath: f.path.split('/').slice(2).join('/')});
        return f;
      });
    });

    $scope.onBrowseData = function onBrowse($event, file) {
      $event.preventDefault();
      var filePath = file.path.split('/').slice(2).join('/');
      $state.go('projects.viewData', {projectId: projectId, filePath: filePath});
    };

  }]);
})(window, angular);
