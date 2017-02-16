(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('ProjectRootCtrl', ['$scope', '$state', 'DataBrowserService', function ($scope, $state, DataBrowserService) {

    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;

    $scope.data = {
      navItems: [],
      projects: []
    };

    $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
      $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

      if (toStateParams.filePath) {
        if (toStateParams.filePath === '/') {
          $scope.data.navItems.push({
            label: toStateParams.projectTitle,
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: '/',
              projectTitle: toStateParams.projectTitle
            })
          });
        } else {
          _.each(toStateParams.filePath.split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '') {
              filePath = '/';
            }
            $scope.data.navItems.push({
              label: e || toStateParams.projectTitle,
              href: $state.href('projects.view.data', {
                projectId: toStateParams.projectId,
                filePath: filePath,
                projectTitle: toStateParams.projectTitle
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
    $scope.ui = {};
    $scope.ui.busy = true;
    $scope.data.projects = [];
    ProjectService.list().then(function(projects) {
      $scope.ui.busy = false;
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('projects.view.data', {projectId: project.uuid,
                                       filePath: '/',
                                       projectTitle: project.value.title});
    };

  }]);

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', '$q', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, $q) {

    $scope.data = {};

    var setEntity = function(resp){
      if (!resp.length){
        return;
      }
      var attribute = $scope.data.project.getRelatedAttrName(resp[0].name);
      $scope.data.project[attribute] = resp;
    };

    ProjectService.get({uuid: projectId}).then(function (project) {
      $scope.data.project = project;
      DataBrowserService.state().project = project;
      DataBrowserService.state().loadingEntities = true;
      var _related = project._related;
      var tasks = [];
      for (var attrname in _related){
        var name = _related[attrname];
        if (name != 'designsafe.file'){
          tasks.push(ProjectService.listEntities(
            {uuid: projectId, name: name})
            .then(
              setEntity
            ));
        }
      }
      $q.all(tasks).then(
        function(resp){
            DataBrowserService.state().loadingEntities = false;
        }, function(err){
            DataBrowserService.state().loadingEntities = false;
        });
    });


    $scope.editProject = function($event) {
      $event.preventDefault();
      ProjectService.editProject($scope.data.project)
        .then(function (project) {
          $scope.data.project = project;
        });
    };

    $scope.manageCollabs = function($event) {
      $event.preventDefault();
      ProjectService.manageCollaborators({uuid: projectId}).then(function (project) {
        $scope.data.project = project;
      });
    };

    $scope.manageExperiments = function($event) {
      $event.preventDefault();
      var experiments = $scope.data.project[$scope.data.project.getRelatedAttrName('designsafe.project.experiment')];
      ProjectService.manageExperiments({'experiments': experiments,
                                        'project': $scope.data.project}).then(function (experiments) {
        $scope.data.experiments = experiments;
      });
    };

    $scope.dateString = function(s){
      var d = Date(s);
      return d;
    };

    $scope.showListing = function(){
      DataBrowserService.state().showMainListing = true;
      DataBrowserService.state().showPreviewListing = false;
      DataBrowserService.showListing();
    };

    $scope.showPreview = function(){
      DataBrowserService.state().showMainListing = false;
      DataBrowserService.state().showPreviewListing = true;
      DataBrowserService.showPreview();
    };

  }]);

  app.controller('ProjectDataCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', 'filePath', 'projectTitle', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, filePath, projectTitle) {
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;
    $scope.browser = DataBrowserService.state();
    if (typeof $scope.browser !== 'undefined'){
      $scope.browser.busy = true;
    }
    var setFileEntities = function(){
      var entities = [].concat($scope.browser.project.experiment_set,
                               $scope.browser.project.event_set,
                               $scope.browser.project.analysis_set,
                               $scope.browser.project.sensorlist_set,
                               $scope.browser.project.modelconfig_set);
      var entitiesFiles = [];
      var sp = 'files/v2/media/system/project-' + $scope.browser.project.uuid;
      _.each($scope.browser.listing.children, function(child){
        if (typeof child._entities === 'undefined'){
          child._entities = [];
          var path = child.path;
          _.each(entities, function(entity){
            if (typeof entity !== 'undefined' &&
                typeof entity._links !== 'undefined' &&
                typeof entity._links.associationIds !== 'undefined'){
              _.each(entity._links.associationIds, function(asc){
                if (asc.title === 'file'){
                  var s = asc.href.split(sp)[1];
                  if (path == s){
                    var _name = entity.name.split('.');
                    var _name = _name[_name.length-1];
                    var camelCased = _name.replace(/_([a-z])/g,
                            function (g) { return g[1].toUpperCase(); });
                    camelCased = camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
                    entity._displayName = camelCased;
                    child._entities.push(entity);
                  }
                }
              });
            }
          });
        }
      });
    };

    DataBrowserService.browse({system: 'project-' + projectId, path: filePath})
      .then(function () {
        $scope.browser = DataBrowserService.state();
        $scope.browser.listing.href = $state.href('projects.view.data', {
          projectId: projectId,
          filePath: $scope.browser.listing.path,
          projectTitle: projectTitle
        });
        _.each($scope.browser.listing.children, function (child) {
          child.href = $state.href('projects.view.data', {
            projectId: projectId,
            filePath: child.path,
            projectTitle: projectTitle
          });
        });
        if (typeof $scope.browser.loadingEntities !== 'undefined' &&
            !$scope.browser.loadingEntities){
          setFileEntities();
        } else {
          $scope.$watch('browser.loadingEntities', function(newVal, oldVal){
            if (!newVal){
              setFileEntities();
            }
          });
        }
      });

    $scope.onBrowseData = function onBrowseData($event, file) {

      $event.preventDefault();
      if (file.type === 'file') {
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('projects.view.data', {projectId: projectId,
                                         filePath: file.path,
                                         projectTitle: projectTitle});
      }
    };

    $scope.scrollToTop = function(){
      return;
    };
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
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
      } else if( typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      }
        else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

  }]);
})(window, angular);
