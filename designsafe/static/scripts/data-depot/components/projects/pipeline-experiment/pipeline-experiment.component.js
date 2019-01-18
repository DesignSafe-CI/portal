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
        this.browser = this.ProjectService.data;
        this.experiment = JSON.parse(window.localStorage.getItem('selectedExp'));
    }

    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {projectId: this.browser.project.uuid}, {reload: true});
    }

    // retrieveExperiment() {
    //     this.experiment = JSON.parse(window.localStorage.getItem('selectedExp'));
    // }

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
