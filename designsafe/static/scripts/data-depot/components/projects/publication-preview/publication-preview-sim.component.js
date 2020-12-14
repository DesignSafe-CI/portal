import PublicationPreviewSimTemplate from './publication-preview-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewSimCtrl {

    constructor($stateParams, ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$q = $q;
    }
    
    $onInit() {
        this.readOnly = this.$state.current.name.indexOf('publishedData') === 0;
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.ui = {
            fileNav: true,
            loading: true,
            loadingUsers: true
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

        

        this.$q.all([
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
            this.ProjectService.getPiData({
                pi: project.value.pi,
                coPis: project.value.coPis
            }).subscribe(x => {
                this.ui.loadingUsers = false;
                this.piMap = x;
            })
        });
    }

    matchingGroup(sim, model) {
        if (!sim) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.simulations.length) {
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
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
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
                    state.go('projects.pipelineSelectSim', {projectId: browser.project.uuid}, {reload: true});
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

    showAuthor(author, needsOrcid = true) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
                needsOrcid
            },
            size: 'author',
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

}

export const PublicationPreviewSimComponent = {
    template: PublicationPreviewSimTemplate,
    controller: PublicationPreviewSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
