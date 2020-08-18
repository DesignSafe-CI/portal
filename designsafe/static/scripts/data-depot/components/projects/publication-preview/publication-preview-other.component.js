import PublicationPreviewOtherTemplate from './publication-preview-other.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewOtherCtrl {

    constructor(ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.project = this.ProjectService.resolveParams.project;
        this.listings = this.ProjectService.resolveParams.selectedListings;
        this.data = this.ProjectService.resolveParams.data;
        this.ui = {
            loading: true,
        };
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };

        if (!this.data || this.data.listing.path != this.filePath) {
            this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                }),
            ]).then(([project, listing]) => {
                this.breadcrumbParams = {
                    root: {label: project.value.projectId, path: ''}, 
                    path: this.FileListingService.listings.main.params.path,
                    skipRoot: false
                };
                this.browser.project = project;
                this.browser.listing = listing;
                this.ui.loading = false;
            });
        } else {
            this.browser = this.data;
            this.ui.loading = false;
        }
    }

    matchingGroup(exp, model) {
        if (!exp) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the experiment level
            // match appropriate data to corresponding experiment
            if(model.associationIds.indexOf(exp.uuid) > -1) {
                return true;
            }
            return false;
        }
    }
    
    goWork() {
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser}, {reload: true});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid, data: this.browser}, {reload: true});
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
                    state.go('projects.pipelineSelectOther', {projectId: browser.project.uuid}, {reload: true});
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

    treeDiagram(rootCategory) {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
                rootCategoryUuid: () => {return rootCategory.uuid; },
                readOnly: () => {return true;},
            },
            size: 'lg'
        });
    }

    showAuthor(author) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
            },
            size: 'author',
        });
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            //this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')}, {inherit: false})
            this.$state.go(this.$state.current.name, {filePath: file.path})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

}


export const PublicationPreviewOtherComponent = {
    template: PublicationPreviewOtherTemplate,
    controller: PublicationPreviewOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
