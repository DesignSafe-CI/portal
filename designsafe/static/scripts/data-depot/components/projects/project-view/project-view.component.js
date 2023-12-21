import ProjectViewTemplate from './project-view.component.html';
const FacilityData = require('../../../../projects/components/facility-data.json');

class ProjectViewCtrl {

  constructor(ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, UserService, $state, $stateParams, $q, $uibModal) {
    'ngInject';

    this.ProjectEntitiesService = ProjectEntitiesService;
    this.ProjectService = ProjectService;
    this.FileListingService = FileListingService;
    this.FileOperationService = FileOperationService;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.$uibModal = $uibModal;
    this.UserService = UserService;
    this.authorData = {
      pi: {},
      coPis: null,
    };
  }

  $onInit() {
    this.ui = {
      showEdit: true,
      showOverview: true,
      facilities: FacilityData.facility.facilities_list,
    };
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
      this.project = this.ProjectService.current;
    }
    this.$q.all(promisesToResolve).then(({project, listing, entities}) => {
      if (project) {
        this.project = project;
        this.project.appendEntitiesRel(entities);
      }
      const projectEntities = this.project.getAllRelatedObjects();
      this.FileListingService.setEntities('main', projectEntities);

      // convert usernames to full author data
      // get pi
      this.UserService.get(this.project.value.pi).then((res) => {
        this.authorData.pi = {
          fname: res.first_name,
          lname: res.last_name,
          email: res.email,
          name: res.username,
          inst: res.profile.institution,
        };
      });

      // get copi(s)
      if (this.project.value.coPis) {
        this.authorData.coPis = new Array(this.project.value.coPis.length);
        this.project.value.coPis.forEach((coPi, idx) => {
          this.UserService.get(coPi).then((res) => {
            this.authorData.coPis[idx] = {
              fname: res.first_name,
              lname: res.last_name,
              email: res.email,
              name: res.username,
              inst: res.profile.institution,
            };
          });
        });
      }

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
        project: () => this.project,
      },
      backdrop: 'static',
      size: 'lg',
    });
  }

  overview() {
    this.$uibModal.open({
        component: 'manageProjectType',
        resolve: {
            options: () => { return {'project': this.project, 'preview': true, 'warning': false}; },
        },
        size: 'lg',
    });
  }

  getEF(str) {
    if (str !='' && str !='None') {
        let efs = this.ui.facilities;
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }
  }

  isValid(ent) {
    if (ent && ent != '' && ent != 'None') {
        return true;
    }
    return false;
  }

  workingDirectory() {
    this.$state.go('projects.view', { projectId: this.projectId }).then(() => {
    });
  }

  curationDirectory() {
    if (this.project.value.projectType === 'None') {
      this.manageProject();
    } else {
      this.$state.go('projects.curation', { projectId: this.projectId, data: this.project, filePath: this.filePath});
    }
  }

  publicationPreview() {
    switch (this.project.value.projectType) {
      case 'experimental':
        this.$state.go('projects.preview', {projectId: this.project.uuid});
        break;
      case 'simulation':
        this.$state.go('projects.previewSim', {projectId: this.project.uuid});
        break;
      case 'hybrid_simulation':
        this.$state.go('projects.previewHybSim', {projectId: this.project.uuid});
        break;
      case 'field_recon':
        this.$state.go('projects.previewFieldRecon', {projectId: this.project.uuid});
        break;
      case 'other':
        this.$state.go('projects.previewOther', {projectId: this.project.uuid});
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

  showAuthor(author) {
    this.$uibModal.open({
        component: 'authorInformationModal',
        resolve: {
            author,
        },
        size: 'author'
    });
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
