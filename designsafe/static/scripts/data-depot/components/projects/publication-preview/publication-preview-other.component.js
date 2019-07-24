import PublicationPreviewOtherTemplate from './publication-preview-other.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import _ from 'underscore';

class PublicationPreviewOtherCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.browser = this.DataBrowserService.state();
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.project = this.ProjectService.resolveParams.project;
        this.listings = this.ProjectService.resolveParams.selectedListings;
        this.loading = true;
        window.sessionStorage.clear();


        if (this.project || this.listings) {
            this.browser.project = this.project;
            this.browser.listings = this.listings;
            this.loading = false;
        } else {
            /*
            update uniqe file listing
            we might want to consider a adding this to the
            FilesListing service if we start using it in
            multiple places...
            */
            
            this.ProjectService.get({ uuid: this.projectId }
            ).then((project) => {
                this.browser.project = project;
                return this.DataBrowserService.browse(
                    { system: 'project-' + this.projectId, path: this.filePath },
                    { query_string: this.$state.params.query_string }
                );
            }).then((listing) => {
                this.loading = false;
                this.browser.listing = listing;
                this.browser.listing.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: this.browser.listing.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                this.browser.showMainListing = true;
            });
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
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goCuration() {
        window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid, project: this.browser.project, selectedListings: this.browser.listings}, {reload: true});
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
}

PublicationPreviewOtherCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$uibModal', '$state', '$q'];

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
