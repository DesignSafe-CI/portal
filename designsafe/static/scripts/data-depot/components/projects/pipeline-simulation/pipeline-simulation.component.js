import PipelineSimulationTemplate from './pipeline-simulation.component.html';
import _ from 'underscore';

class PipelineSimulationCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.simulation = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.$state.go('projects.pipelineSelectSim', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.simulation,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategoriesSim', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.simulation,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    editExp() {
        this.ProjectService.manageSimulations({'simulations': this.project.simulation_set, 'project': this.project, 'edit': this.simulation});
    }

}

PipelineSimulationCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineSimulationComponent = {
    template: PipelineSimulationTemplate,
    controller: PipelineSimulationCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
