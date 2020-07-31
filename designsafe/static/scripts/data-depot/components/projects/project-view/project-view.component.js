import ProjectViewTemplate from './project-view.component.html';

class ProjectViewCtrl {

  constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q, $uibModal) {
    'ngInject';

    this.ProjectEntitiesService = ProjectEntitiesService;
    this.ProjectService = ProjectService;
    this.DataBrowserService = DataBrowserService;
    this.FileListing = FileListing;
    this.browser = this.DataBrowserService.state();
    this.$state = $state;
    this.$q = $q;
    this.$uibModal = $uibModal;
  }

  $onInit() {
    this.projectId = this.ProjectService.resolveParams.projectId;
    this.filePath = this.ProjectService.resolveParams.filePath;
    this.data = this.ProjectService.resolveParams.data;
    this.loading = true;
    this.fl = {
      showSelect: true,
      showHeader: true,
      showTags: true,
      editTags: false,
    };

    if (typeof this.browser.listings != 'undefined') {
      delete this.browser.listings;
    }

    if (this.data && this.data.listing.path == this.filePath) {
      this.browser = this.data;
      this.loading = false;
    } else {
      this.$q.all([
        this.ProjectService.get({ uuid: this.projectId }),
        this.DataBrowserService.browse(
          { system: 'project-' + this.projectId, path: this.filePath },
          { query_string: this.$state.params.query_string }
        ),
        this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
      ]).then(([project, listing, entities]) => {
        this.browser.project = project;
        this.browser.project.appendEntitiesRel(entities);
        this.browser.listing = listing;
        this.browser.listing.href = this.$state.href('projects.view.data', {
          projectId: this.projectId,
          filePath: this.browser.listing.path,
          projectTitle: this.browser.project.value.projectTitle,
        });
        this.browser.listing.children.forEach((child) => {
          child.href = this.$state.href('projects.view.data', {
            projectId: this.projectId,
            filePath: child.path,
            projectTitle: this.browser.project.value.projectTitle,
          });
          child.setEntities(this.projectId, entities);
        });
        this.loading = false;
      });
    }
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

  overview() {
    this.$uibModal.open({
        component: 'manageProjectType',
        resolve: {
            options: () => { return {'project': this.browser.project, 'preview': true, 'warning': false}; },
        },
        size: 'lg',
    });
  }

  workingDirectory() {
    this.$state.go('projects.view.data', { projectId: this.projectId }).then(() => {
    });
  }

  curationDirectory() {
    if (this.browser.project.value.projectType === 'None') {
      this.manageProjectType();
    } else {
      this.$state.go('projects.curation', { projectId: this.projectId, data: this.browser, filePath: this.filePath});
    }
  }

  publicationPreview() {
    if (this.browser.project.value.projectType === 'experimental') {
      this.$state.go('projects.preview', { projectId: this.browser.project.uuid});
    } else if (this.browser.project.value.projectType === 'simulation') {
      this.$state.go('projects.previewSim', { projectId: this.browser.project.uuid});
    } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
      this.$state.go('projects.previewHybSim', {projectId: this.browser.project.uuid});
    } else if (this.browser.project.value.projectType === 'other') {
      this.$state.go('projects.previewOther', { projectId: this.browser.project.uuid});
    } else if (this.browser.project.value.projectType === 'field_recon') {
      this.$state.go('projects.previewFieldRecon', { projectId: this.browser.project.uuid});
    } else {
      this.manageProjectType();
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
