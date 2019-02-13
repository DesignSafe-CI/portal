import PipelineCategoriesHybSimTemplate from './pipeline-categories-hyb-sim.component.html';
import _ from 'underscore';

class PipelineCategoriesHybSimCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.simulation = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        this.browser.project = this.project;
        this.browser.listings = this.selectedListings;

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelectHybSim', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }
    
    goSimulation() {
        this.$state.go('projects.pipelineHybrid', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.simulation,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.simulation,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    editCategory() {
        this.ProjectService.manageCategories({'project': this.browser.project, 'selectedListings': this.selectedListings});
    }

    matchingGroup(sim, model) {
        // if the category is related to the project level
        if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.hybridSimulations.length) {
            return true;
        } else {
            // if the category is related to the simulation level
            // match appropriate data to corresponding simulation
            if(model.associationIds.indexOf(sim.uuid) > -1) {
                return true;
            }
            return false;
        }
    }
}

PipelineCategoriesHybSimCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$state', '$q'];

export const PipelineCategoriesHybSimComponent = {
    template: PipelineCategoriesHybSimTemplate,
    controller: PipelineCategoriesHybSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
