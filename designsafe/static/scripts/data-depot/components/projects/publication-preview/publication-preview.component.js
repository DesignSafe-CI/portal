import PublicationPreviewTemplate from './publication-preview.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import _ from 'underscore';

class PublicationPreviewCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
    }

    $onInit() {
        console.log('Publication Preview Initiated...');
        this.browser = this.ProjectEntitiesService.data;
        console.log(this.browser);
    }

    // Might have to move this to the project-view.component?
    launchModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: function($uibModalInstance) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                };
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
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
