import PipelineAuthorsTemplate from './pipeline-authors.component.html';
import _ from 'underscore';

class PipelineAuthorsCtrl {

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

    goCategories() {
        this.$state.go('projects.pipelineCategories', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goLicenses() {
        this.$state.go('projects.pipelineLicenses', {projectId: this.browser.project.uuid}, {reload: true});
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

PipelineAuthorsCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineAuthorsComponent = {
    template: PipelineAuthorsTemplate,
    controller: PipelineAuthorsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
