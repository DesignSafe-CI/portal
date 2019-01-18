import PipelineCategoriesTemplate from './pipeline-categories.component.html';
import _ from 'underscore';

class PipelineCategoriesCtrl {

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
    
    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {projectId: this.browser.project.uuid}, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {projectId: this.browser.project.uuid}, {reload: true});
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

PipelineCategoriesCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineCategoriesComponent = {
    template: PipelineCategoriesTemplate,
    controller: PipelineCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
