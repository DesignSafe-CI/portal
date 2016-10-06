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

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', 'filePath', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, filePath) {

    $scope.data = {};

    ProjectService.get({uuid: projectId}).then(function(project) {
      $scope.data.project = project;
    });

    DataBrowserService.browse({system: 'designsafe.storage.projects', path: projectId + '/' + filePath})
      .then(function (result) {
        $scope.browser = DataBrowserService.state();
      });

    $scope.onBrowseData = function onBrowseData($event, file) {
      $event.preventDefault();
      var filePath = file.path.split('/').slice(2).join('/');
      $state.go('projects.viewData', {projectId: projectId, filePath: filePath});
    };

    $scope.onSelectData = function onSelectData($event, file) {
      $event.stopPropagation();

      if ($event.ctrlKey || $event.metaKey) {
        var selectedIndex = $scope.browser.selected.indexOf(file);
        if (selectedIndex > -1) {
          DataBrowserService.deselect([file]);
        } else {
          DataBrowserService.select([file]);
        }
      } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
        var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
        var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
        var fileIndex = $scope.browser.listing.children.indexOf(file);
        var min = Math.min(lastIndex, fileIndex);
        var max = Math.max(lastIndex, fileIndex);
        DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
      } else {
        DataBrowserService.select([file], true);
      }
    };

  }]);
})(window, angular);
