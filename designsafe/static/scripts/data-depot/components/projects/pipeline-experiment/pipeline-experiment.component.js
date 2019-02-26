import PipelineExperimentTemplate from './pipeline-experiment.component.html';
import _ from 'underscore';

class PipelineExperimentCtrl {

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
        this.experiment = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelect', {projectId: this.projectId}, {reload: true});
        }
    }

    hasEndDate(date) {
        if (Date.parse(date)) {
            return true;
        }
        return false;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    editExp() {
        this.ProjectService.manageExperiments({'experiments': this.project.experiment_set, 'project': this.project, 'edit': this.experiment});
    }

}

PipelineExperimentCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineExperimentComponent = {
    template: PipelineExperimentTemplate,
    controller: PipelineExperimentCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
