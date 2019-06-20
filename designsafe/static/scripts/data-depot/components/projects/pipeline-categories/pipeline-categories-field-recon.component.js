import PipelineCategoriesFieldReconTemplate from './pipeline-categories-field-recon.component.html';

class PipelineCategoriesFieldReconCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.mission = this.ProjectService.resolveParams.experiment;
        this.browser.project = this.ProjectService.resolveParams.project;
        this.browser.listings = this.ProjectService.resolveParams.selectedListings;


        if (!this.browser.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelectFieldRecon', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }
    
    goFieldRecon() {
        this.$state.go('projects.pipelineFieldRecon', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.mission,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.mission,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }

    editCollection(selection) {
        this.$uibModal.open({
            component: 'fieldReconCollectionsModal',
            resolve: {
                project: () => { return this.browser.project; },
                selectedListings: () => { return this.browser.listings; },
                edit: () => { return selection; },
            },
            size: 'lg',
        });
    }

    matchingGroup(sim, model) {
        // if the category is related to the project level
        if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.missions.length) {
            return true;
        } else {
            // if the category is related to the mission level
            // match appropriate data to corresponding mission
            if(model.associationIds.indexOf(sim.uuid) > -1) {
                return true;
            }
            return false;
        }
    }
}

export const PipelineCategoriesFieldReconComponent = {
    template: PipelineCategoriesFieldReconTemplate,
    controller: PipelineCategoriesFieldReconCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
