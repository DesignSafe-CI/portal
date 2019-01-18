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
        this.browser = this.ProjectService.data;
    }

    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goSelection() {
        this.$state.go('projects.pipelineSelect', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {projectId: this.browser.project.uuid}, {reload: true});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
    }

    matchingGroup(exp, model) {
        // match appropriate data to corresponding experiment
        var result = false;
        model.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
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
