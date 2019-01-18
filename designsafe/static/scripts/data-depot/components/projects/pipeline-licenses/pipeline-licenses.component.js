import PipelineLicensesTemplate from './pipeline-licenses.component.html';
import _ from 'underscore';

class PipelineLicensesCtrl {

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

    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {projectId: this.browser.project.uuid}, {reload: true});
    }

    // Modal for accept and publish...

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

PipelineLicensesCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineLicensesComponent = {
    template: PipelineLicensesTemplate,
    controller: PipelineLicensesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
