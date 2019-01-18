import PublicationPreviewTemplate from './publication-preview.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import _ from 'underscore';

class PublicationPreviewCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.browser = this.ProjectService.data;

        this.setEntitiesRel = (resp) => {
            this.browser.project.appendEntitiesRel(resp);
            return resp;
        };

        // get project data if necessary (if a user refreshes or visits path directly)
        if (!this.browser.project) {
            this.ProjectService.get({uuid: this.projectId}).then((project) => {
                this.browser.project = project;
                this.ProjectEntitiesService.listEntities({uuid: this.projectId, name: 'all'}).then(this.setEntitiesRel);
            });
        }
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
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
    }

    prepareModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'state', 'browser', function($uibModalInstance, state, browser) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                    state.go('projects.pipelineSelect', {projectId: browser.project.uuid}, {reload: true});
                };
            }],
            resolve: {
                browser: this.browser,
                state: this.$state,
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
    }
}

PublicationPreviewCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

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
