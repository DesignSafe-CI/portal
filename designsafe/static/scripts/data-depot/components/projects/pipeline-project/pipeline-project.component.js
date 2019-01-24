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
        this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goSelection() {
        this.$state.go('projects.pipelineSelect', {projectId: this.project.uuid}, {reload: true});
    }

    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {projectId: this.project.uuid}, {reload: true});
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
