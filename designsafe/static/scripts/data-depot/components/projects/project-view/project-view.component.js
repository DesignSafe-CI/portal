import ProjectViewTemplate from './project-view.component.html';

class ProjectViewCtrl {

  constructor(ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $state, $stateParams, $q, $uibModal) {
    'ngInject';

    this.ProjectEntitiesService = ProjectEntitiesService;
    this.ProjectService = ProjectService;
    this.FileListingService = FileListingService;
    this.FileOperationService = FileOperationService;
    this.browser = {};
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.$uibModal = $uibModal;
  }

  $onInit() {
    this.projectId = this.$stateParams.projectId
    this.filePath = this.$stateParams.filePath
    
    this.fl = {
      showSelect: true,
      showHeader: true,
      showTags: true,
      editTags: false,
    };

    const promisesToResolve = {
        listing: this.FileListingService.browse({
            section: 'main',
            api: 'agave',
            scheme: 'private',
            system: 'project-' + this.projectId,
            path: this.filePath,
            query_string: this.$stateParams.query_string
        }),
    };

    if ( !(this.ProjectService.current && this.ProjectService.current.uuid === this.projectId )){
      this.loading = true;
      promisesToResolve.project = this.ProjectService.get({ uuid: this.projectId })
      promisesToResolve.entities = this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }) 
    } 
    else {
      this.browser.project = this.ProjectService.current;
    }
    this.$q.all(promisesToResolve).then(({project, listing, entities}) => {
      if (project) {
        this.browser.project = project;
        this.browser.project.appendEntitiesRel(entities);
      }
      const projectEntities = this.browser.project.getAllRelatedObjects();
      this.FileListingService.setEntities('main', projectEntities);
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

  manageProject() {
    return this.$uibModal.open({
      component: 'manageProject',
      resolve: {
        project: () => this.browser.project,
      },
      backdrop: 'static',
      size: 'lg',
    });
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
    this.$state.go('projects.view', { projectId: this.projectId }).then(() => {
    });
  }

  curationDirectory() {
    if (this.browser.project.value.projectType === 'None') {
      this.manageProject();
    } else {
      this.$state.go('projects.curation', { projectId: this.projectId, data: this.browser, filePath: this.filePath});
    }
  }

  publicationPreview() {
    switch (this.browser.project.value.projectType) {
      case 'experimental':
        this.$state.go('projects.preview', {projectId: this.browser.project.uuid});
        break;
      case 'simulation':
        this.$state.go('projects.previewSim', {projectId: this.browser.project.uuid});
        break;
      case 'hybrid_simulation':
        this.$state.go('projects.previewHybSim', {projectId: this.browser.project.uuid});
        break;
      case 'field_recon':
        this.$state.go('projects.previewFieldRecon', {projectId: this.browser.project.uuid});
        break;
      case 'other':
        this.$state.go('projects.previewOther', {projectId: this.browser.project.uuid});
        break;
      default:
        this.manageProject();
    }
  }

  onBrowse(file) {
    if (file.type === 'dir') {
      this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, ''), query_string: null})
    }
    else {
      this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
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
