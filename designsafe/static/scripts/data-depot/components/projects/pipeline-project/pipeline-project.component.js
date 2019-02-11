import PipelineProjectTemplate from './pipeline-project.component.html';
import _ from 'underscore';

class PipelineProjectCtrl {

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

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goSelection() {
        this.$state.go('projects.pipelineSelect', {projectId: this.project.uuid}, {reload: true});
    }

    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    editProject() {
        this.ProjectService.editProject(this.project);
    }

}

PipelineProjectCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineProjectComponent = {
    template: PipelineProjectTemplate,
    controller: PipelineProjectCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
