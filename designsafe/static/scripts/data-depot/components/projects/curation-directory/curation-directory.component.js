import CurationDirectoryTemplate from './curation-directory.component.html';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, FileListingService, FileOperationService, $state, $stateParams, $q, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.browser = {}
        this.$state = $state;
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.$stateParams = $stateParams;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.browser.project = this.ProjectService.current;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.fl = {
            showSelect: true,
            showHeader: true,
            showTags: false,
            editTags: true,
        };
        const promisesToResolve = {
            listing: this.FileListingService.browse({
                section: 'main',
                api: 'agave',
                scheme: 'private',
                system: 'project-' + this.projectId,
                path: this.filePath,
                query_string: this.$stateParams.query_string
            }).toPromise(),
        };
        

        if ( !(this.ProjectService.current && this.ProjectService.current.uuid === this.projectId )){//&& this.FileListingService.listings.main.params.path === this.filePath) {
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
        if (val && val.length) {
            if (typeof val[0] === 'string') {
                return true;
            }
        }
        return false;
    }

    matchingGroup(exp, entity) {
        /*
        Match appropriate entity to corresponding experiment, sim, hybsim, etc...
        TODO: might be best to have this set up in ProjectEntitiesService.
        Just want to grab entities related to primary entity
        */
        var result = false;
        entity.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
    
    goWork() {
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser, filePath: this.filePath});
    }

    goPreview() {
        if (this.browser.project.value.projectType === 'experimental') {
            this.$state.go('projects.preview', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'simulation') {
            this.$state.go('projects.previewSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
            this.$state.go('projects.previewHybSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'other') {
            this.$state.go('projects.previewOther', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'field_recon') {
            this.$state.go('projects.previewFieldRecon', {projectId: this.browser.project.uuid, data: this.browser});
        }
    }

    editProject() {
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

    manageExperiments() {
        this.$uibModal.open({
            component: 'manageExperimentsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageSimulations() {
        this.$uibModal.open({
            component: 'manageSimulationsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageHybridSimulations() {
        this.$uibModal.open({
            component: 'manageHybridSimulationsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageCategories() {
        this.$uibModal.open({
            component: 'manageCategories',
            resolve: {
                browser: () => this.browser,
            },
            size: 'lg',
        });
    }

    relateData() {
      this.$uibModal.open({
        component: 'projectTree',
        resolve: {
            project: () => {return this.browser.project; },
        },
        size: 'lg',
      });
    }

    manageFieldReconMissions() {
        this.$uibModal.open({
            component: 'fieldReconMissionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageFieldReconCollections() {
        this.$uibModal.open({
            component: 'fieldReconCollectionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
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

export const CurationDirectoryComponent = {
    template: CurationDirectoryTemplate,
    controller: CurationDirectoryCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
