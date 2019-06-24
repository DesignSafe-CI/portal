import ProjectListingTemplate from './project-listing.component.html';
import _ from 'underscore';

function ProjectListingCtrl($scope, $state, DataBrowserService, Django, ProjectService, UserService) {
    'ngInject';
    $scope.ui = {};
    $scope.ui.busy = true;
    $scope.browser = DataBrowserService.state();
    $scope.browser.error = null;  //clears any potential lingering error messages.
    $scope.data = ProjectService.data;
    $scope.data.projects = [];
    $scope.data.names = {};
    var offset = 0;
    var limit = 100;
    var page = 0;

    // release selected files on load
    DataBrowserService.deselect(DataBrowserService.state().selected);
    ProjectService.list({offset:offset, limit:limit}).then(function(projects) {
      $scope.ui.busy = false;
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
      DataBrowserService.projectBreadcrumbSubject.next();
      $scope.getNames();
    });

    $scope.getNames = function () {
      // get user details in one request
      var piList = [];
      $scope.data.projects.forEach((proj) => {
        if (!piList.includes(proj.value.pi)) {
          piList.push(proj.value.pi);
        }
      });
      UserService.getPublic(piList).then((resp) => {
        var data = resp.userData;
        data.forEach((user) => {
          $scope.data.names[user.username] = user.fname + ' ' + user.lname;
        });
      });
    };

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('projects.view.data', {projectId: project.uuid,
                                       filePath: '/',
                                       projectTitle: project.value.title}, {reload: true});
    };

    // function for when the row is selected, but the link to the project detail page is not
    $scope.onSelect = function($event, project) {
      var selectedProjects = DataBrowserService.state().selectedProjects;
      // holding ctrl key should toggle selected project but leave other projects unchanged
      if ($event.ctrlKey || $event.metaKey) {
        DataBrowserService.toggleProjects(project);
      }
      // shift key should select all projects between the last clicked project and the current clicked project
      else if ($event.shiftKey && selectedProjects.length > 0) {
        // get
        var lastProject = selectedProjects[selectedProjects.length - 1];
        var lastIndex = $scope.data.projects.indexOf(lastProject);
        var projectIndex = $scope.data.projects.indexOf(project);
        var min = Math.min(lastIndex, projectIndex);
        var max = Math.max(lastIndex, projectIndex);
        DataBrowserService.selectProjects($scope.data.projects.slice(min, max + 1));
      }
      // else no special scenario. we toggle the clicked project and unselect all others.
      else {
        DataBrowserService.toggleProjects(project, true);
      }
    };

    $scope.scrollToTop = function () {
      return;
    };

    $scope.scrollToBottom = function () {
      offset = 0;

      if ($scope.browser.loadingMore || $scope.browser.reachedEnd) {
        return;
      }
      
      $scope.browser.busyListingPage = true;
      $scope.browser.loadingMore = true;
      page += 1;
      offset = limit * page;

      ProjectService.list({offset: offset, limit: limit}).then(function (projects) {  
        //This is making a listing call and adding it to the existing Project list
        $scope.data.projects = $scope.data.projects.concat(_.map(projects, 
          function (p) { p.href = $state.href('projects.view', { projectId: p.uuid }); return p; }));  
        $scope.browser.busyListingPage = false;
      });

      $scope.browser.loadingMore = false;

      if ($scope.data.projects.length < offset) {
        $scope.browser.reachedEnd = true;
      } 
    };
  }

export const ProjectListingComponent = {
    controller: ProjectListingCtrl,
    controllerAs: '$ctrl',
    template: ProjectListingTemplate
};