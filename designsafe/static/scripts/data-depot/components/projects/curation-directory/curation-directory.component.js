import CurationDirectoryTemplate from './curation-directory.component.html';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, UserService, $state, $stateParams, $q, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.UserService = UserService;
        this.$state = $state;
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.$stateParams = $stateParams;
        this.authorData = {
            pi: {},
            coPis: null,
        };
    }

    $onInit() {
        this.ui = {
            showEdit: true,
            showOverview: true,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.current;
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
            })
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
        this.$state.go('projects.view', {projectId: this.project.uuid, data: this.project, filePath: this.filePath});
    }

    goPreview() {
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
            default:
                this.$state.go('projects.previewOther', {projectId: this.project.uuid});
        }
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
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageExperiments() {
        this.$uibModal.open({
            component: 'manageExperimentsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageSimulations() {
        this.$uibModal.open({
            component: 'manageSimulationsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageHybridSimulations() {
        this.$uibModal.open({
            component: 'manageHybridSimulationsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageCategories() {
        this.$uibModal.open({
            component: 'manageCategories',
            resolve: {
                project: () => this.project,
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    relateData() {
      this.$uibModal.open({
        component: 'projectTree',
        resolve: {
            project: () => {return this.project; },
        },
        backdrop: 'static',
        size: 'lg',
      });
    }

    manageFieldReconMissions() {
        this.$uibModal.open({
            component: 'fieldReconMissionsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageFieldReconDocuments() {
        this.$uibModal.open({
            component: 'fieldReconDocumentsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    manageFieldReconCollections() {
        this.$uibModal.open({
            component: 'fieldReconCollectionsModal',
            resolve: {
                project: () => { return this.project; },
            },
            backdrop: 'static',
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
