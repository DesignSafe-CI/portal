import PipelineLicensesTemplate from './pipeline-licenses.component.html';
import AgreementTemplate from './pipeline-agreement.html';
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
        this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
        this.license = '';
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {projectId: this.project.uuid}, {reload: true});
    }

    // Modal for accept and publish...
    prepareModal() {
        this.$uibModal.open({
            template: AgreementTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'project', function($uibModalInstance, project) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.agree = function () {
                    var agreement = document.getElementById("agreement");
                    if (agreement.checked == true) {
                        this.valid = true;
                    } else {
                        this.valid = false;
                    }
                };
                this.publish = function () {
                    console.log('publishing project...');
                    console.log(project);
                    $uibModalInstance.close('Continue to publication pipeline...');
                };
            }],
            resolve: {
                project: this.project,
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
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
