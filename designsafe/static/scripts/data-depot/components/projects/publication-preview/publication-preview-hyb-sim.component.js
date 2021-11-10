import PublicationPreviewHybSimTemplate from './publication-preview-hyb-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewHybSimCtrl {

    constructor($stateParams, ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$q = $q;
        this.FileOperationService = FileOperationService;
    }
    
    $onInit() {
        this.readOnly = this.$state.current.name.indexOf('publishedData') === 0;
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.ui = {
            fileNav: true,
            loading: true
        };
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };


        if (this.filePath === '/' && !this.$stateParams.query_string) {
            this.ui.fileNav = false;
        }

        this.$q
            .all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                    query_string: this.$stateParams.query_string
                }),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
            ])
            .then(([project, listing, ents]) => {
                this.breadcrumbParams = {
                    root: {label: project.value.projectId, path: ''}, 
                    path: this.FileListingService.listings.main.params.path,
                    skipRoot: false
                };
                this.browser.project = project;
                this.browser.project.appendEntitiesRel(ents);
                this.browser.listing = this.FileListingService.listings.main.listing;
                this.FileListingService.abstractListing(ents, project.uuid).then((_) => {
                    this.ui.loading = false;
                });
            });
    }

    matchingGroup(sim, model) {
        if (!sim) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.hybridSimulations.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the simulation level
            // match appropriate data to corresponding simulation
            if(model.associationIds.indexOf(sim.uuid) > -1) {
                return true;
            }
            return false;
        }
    }
    
    goWork() {
        this.$state.go('projects.view', {projectId: this.browser.project.uuid});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid});
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

    prepareModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'state', 'browser', function($uibModalInstance, state, browser) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                    state.go('projects.pipelineStart', {projectId: browser.project.uuid}, {reload: true});
                };
            }],
            resolve: {
                browser: this.browser,
                state: this.$state,
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
    }

    treeDiagram() {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
                readOnly: () => {return true;},
            },
            size: 'lg'
        });
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            //this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')}, {inherit: false})
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, ''), query_string: null})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

    filteredHazmapperMaps(maps) {
        maps = maps ? maps : [];

        maps.forEach(map => {
            switch(map.deployment) {
                case 'production':
                    map.href = `https://hazmapper.tacc.utexas.edu/hazmapper/project/${map.uuid}`;
                    break;
                case 'staging':
                    map.href = `https://hazmapper.tacc.utexas.edu/staging/project/${map.uuid}`;
                    break;
                default:
                    map.href = `http://localhost:4200/project/${map.uuid}`;
            }
        });

        if (window.location.origin.includes('designsafe-ci.org')) {
            return maps.filter(map => map.deployment === 'production');
        }

        return maps;
    }
}

export const PublicationPreviewHybSimComponent = {
    template: PublicationPreviewHybSimTemplate,
    controller: PublicationPreviewHybSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
