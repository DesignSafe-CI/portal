import PublicationPreviewTemplate from './publication-preview.component.html';
import _ from 'underscore';

class PublicationPreviewCtrl {

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

PublicationPreviewCtrl.$inject = ['ProjectService', 'ProjectEntitiesService', '$uibModal'];

export const PublicationPreviewComponent = {
    template: PublicationPreviewTemplate,
    controller: PublicationPreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
