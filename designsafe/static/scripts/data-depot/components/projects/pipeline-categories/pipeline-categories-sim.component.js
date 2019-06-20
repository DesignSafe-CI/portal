import PipelineCategoriesSimTemplate from './pipeline-categories-sim.component.html';
import _ from 'underscore';

class PipelineCategoriesSimCtrl {

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
        // this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.simulation = this.ProjectService.resolveParams.experiment;
        this.browser.project = this.ProjectService.resolveParams.project;
        this.browser.listings = this.ProjectService.resolveParams.selectedListings;


        if (!this.browser.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelectSim', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }
    
    goSimulation() {
        this.$state.go('projects.pipelineSimulation', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.simulation,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.simulation,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }

    editCategory(selection) {
        this.ProjectService.manageCategories({'project': this.browser.project, 'selectedListings': this.browser.listings, 'edit': selection});
    }

    matchingGroup(sim, model) {
        // if the category is related to the project level
        if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.simulations.length) {
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

PipelineCategoriesSimCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$state', '$q'];

export const PipelineCategoriesSimComponent = {
    template: PipelineCategoriesSimTemplate,
    controller: PipelineCategoriesSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
