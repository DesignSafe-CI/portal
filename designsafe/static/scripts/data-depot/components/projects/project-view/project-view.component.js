import _ from 'underscore';
import ProjectViewTemplate from './project-view.component.html';

class ProjectViewCtrl {

  constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q, $http) {
    'ngInject';

    this.ProjectEntitiesService = ProjectEntitiesService;
    this.ProjectService = ProjectService;
    this.DataBrowserService = DataBrowserService;
    this.FileListing = FileListing;
    this.browser = this.DataBrowserService.state();
    this.$state = $state;
    this.$q = $q;
    this.$http = $http;
  }

  $onInit() {
    this.projectId = this.ProjectService.resolveParams.projectId;
    this.filePath = this.ProjectService.resolveParams.filePath;
    this.loading = true;

    this.checkState = () => {
      this.workingDir = false;
      var broken = this.$state.current.name.split('.');
      var last = broken.pop();
      if (last == 'data') {
        this.workingDir = true;
      }
    };

    this.browser.projectServicePromise = this.ProjectService.get({ uuid: this.projectId }
    ).then((project) => {
      this.browser.project = project;
      return this.DataBrowserService.browse(
        { system: 'project-' + this.projectId, path: this.filePath },
        { query_string: this.$state.params.query_string }
      );
    }).then((listing) => {
      this.browser.listing = listing;
      this.browser.listing.href = this.$state.href('projects.view.data', {
        projectId: this.projectId,
        filePath: this.browser.listing.path,
        projectTitle: this.browser.project.value.projectTitle,
      });
      this.browser.showMainListing = true;
      this.loading = false;
    });
  }

  isSingle(val) {
    // we will have older projects with a single award number as a string
    if (val.length) {
        if (typeof val[0] === 'string') {
            return true;
        }
    }
    return false;
}

  editProject($event) {
    if ($event) {
      $event.preventDefault();
    }
    this.ProjectService.editProject(this.browser.project);
  }

  manageProjectType($event) {
    if ($event) {
      $event.preventDefault();
    }
    this.ProjectService.manageProjectType({ 'project': this.browser.project, 'warning': false });
  }

  workingDirectory() {
    this.$state.go('projects.view.data', { projectId: this.projectId }).then(() => {
    });
  }

  curationDirectory() {
    if (this.browser.project.value.projectType === 'None') {
      this.manageProjectType();
    } else {
      this.$state.go('projects.curation', { projectId: this.projectId }, { reload: true });
    }
  }

  publicationPreview() {
    if (this.browser.project.value.projectType === 'experimental') {
      this.$state.go('projects.preview', { projectId: this.browser.project.uuid }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'simulation') {
      this.$state.go('projects.previewSim', { projectId: this.browser.project.uuid }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
      this.$state.go('projects.previewHybSim', { projectId: this.browser.project.uuid }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'other') {
      this.$state.go('projects.previewOther', { projectId: this.browser.project.uuid }).then(() => {
        this.checkState();
      });
    }
  }
}

export const ProjectViewComponent = {
  controller: ProjectViewCtrl,
  controllerAs: '$ctrl',
  template: ProjectViewTemplate,
  bindings: {
    resolve: '<',
    projectId: '<'
  }
};
