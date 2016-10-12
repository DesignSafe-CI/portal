(function(window, angular) {
  var app = angular.module('DataDepotApp');

  app.controller('ProjectRootCtrl', ['$scope', '$state', function ($scope, $state) {

    $scope.data = {
      navItems: []
    };

    $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
      $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

      if (toStateParams.filePath) {
        if (toStateParams.filePath === '/') {
          $scope.data.navItems.push({
            label: toStateParams.projectId,
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: '/'
            })
          });
        } else {
          _.each(toStateParams.filePath.split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '') {
              filePath = '/';
            }
            $scope.data.navItems.push({
              label: e || toStateParams.projectId,
              href: $state.href('projects.view.data', {
                projectId: toStateParams.projectId,
                filePath: filePath
              })
            });
          });
        }
      }

      if ($state.current.name === 'projects') {
        $state.go('projects.list');
      }
    });
  }]);

  app.controller('ProjectListingCtrl', ['$scope', '$state', 'Django', 'ProjectService', function ($scope, $state, Django, ProjectService) {

    ProjectService.list().then(function(projects) {
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('projects.view.data', {projectId: project.uuid, filePath: '/'});
    };

  }]);

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId) {

    $scope.data = {};

    ProjectService.get({uuid: projectId}).then(function(project) {
      $scope.data.project = project;
    });

  }]);

  app.controller('ProjectDataCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', 'filePath', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, filePath) {

    DataBrowserService.browse({system: 'project-' + projectId, path: filePath})
      .then(function () {
        $scope.browser = DataBrowserService.state();
        $scope.browser.listing.href = $state.href('projects.view.data', {
          projectId: projectId, filePath: $scope.browser.listing.path
        });
        _.each($scope.browser.listing.children, function (child) {
          child.href = $state.href('projects.view.data', {
            projectId: projectId, filePath: child.path
          });
        });
      });

    $scope.onBrowseData = function onBrowseData($event, file) {
      $event.preventDefault();
      $state.go('projects.view.data', {projectId: projectId, filePath: file.path});
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
