//MARK FOR DEPRECATION
import _ from 'underscore';
import projectRootTemplate from './project-root.component.html';

export function ProjectRootCtrl($scope, $state, DataBrowserService, ProjectService) {
    'ngInject';
    $scope.browser = DataBrowserService.state();
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = 'projects.list';

    // DataBrowserService.currentListing = 'new listing thing.'
    // release selected files
    DataBrowserService.deselect(DataBrowserService.state().selected);
    $scope.data = ProjectService.data;

    $scope.stateReload = function() {
      $state.reload();
    };


    DataBrowserService.projectBreadcrumbSubject.subscribe( () =>  {
      $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

      // Create a function that checks if 'toStateParams.projectTitle' is empty. Replace it if so...
      // this function will compare the project uuid to the state's projectID
      // it will then return the 'title' of the matching project in place of the state's missing 'projectTitle'
      function getTitle(tsp, proj) {
        if (tsp.projectTitle === "") {
          if (proj.length > 0) {
            index = proj.findIndex(x => x.uuid==tsp.projectId);
            return proj[index].value.title;
          }
        } else {
          return tsp.projectTitle;
        }
      }


      if ($state.params.filePath) {
        if ($state.params.filePath.replace('%2F', '/') === '/') {
          $scope.data.navItems.push({
            label: DataBrowserService.state().project.value.title,
            href: $state.href('projects.view.data', {
              projectId: $state.params.projectId,
              filePath: '/',
              projectTitle: DataBrowserService.state().project.value.title,
              query_string: ''
            })
          });
        } else {
          _.each($state.params.filePath.replace('%2F', '/').split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '' || filePath === '$SEARCH') {
              filePath = '/';
            }
            if (e === '$SEARCH') {
              e = ''
            }
            $scope.data.navItems.push({
              label: e || DataBrowserService.state().project.value.title,
              href: $state.href('projects.view.data', {
                projectId: $state.params.projectId,
                filePath: filePath,
                projectTitle: DataBrowserService.state().project.value.title,
                query_string: ''
              })
            });
          });
        }
      } else {
        
        // when the user is in the base project file's directory 
        // display the project title in the breadcrumbs
        $scope.data.navItems.push({
          label: getTitle($state.params, $scope.data.projects),
          href: $state.href('projects.view.data', {
            projectId: $state.params.projectId,
            filePath: '/',
            projectTitle: getTitle($state.params, $scope.data.projects),
            query_string: ''
          })
        });
      }
    });
    //$state.go('projects.list');
  }

  export const ProjectRootComponent = {
      controller: ProjectRootCtrl,
      controllerAs: '$ctrl',
      template: projectRootTemplate
  }

  