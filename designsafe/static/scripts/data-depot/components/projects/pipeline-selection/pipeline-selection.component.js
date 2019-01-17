import PipelineSelectionTemplate from './pipeline-selection.component.html';
import _ from 'underscore';

class PipelineSelectionCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
    }

    $onInit() {
        this.browser = this.ProjectEntitiesService.data;
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

PipelineSelectionCtrl.$inject = ['ProjectService', 'ProjectEntitiesService', '$uibModal'];

export const PipelineSelectionComponent = {
    template: PipelineSelectionTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
