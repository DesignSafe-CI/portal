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
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.experiment = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.license = '';

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
           this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
           this.ProjectService.get({ uuid: this.projectId }).then((project) => {
               this.projType = project.value.projectType;
               this.uuid = project.uuid;
               if (this.projType === 'experimental') {
                   this.$state.go('projects.pipelineSelect', {projectId: this.uuid}, {reload: true});
               } else if (this.projType === 'simulation') {
                   this.$state.go('projects.pipelineSelectSim', {projectId: this.uuid}, {reload: true});
               } else if (this.projType === 'hybrid_simulation') {
                   this.$state.go('projects.pipelineSelectHybSim', {projectId: this.uuid}, {reload: true});
               } else if (this.projType === 'other') {
                this.$state.go('projects.pipelineSelectOther', {projectId: this.uuid}, {reload: true});
               }
           });
        } else {
            this.projType = this.project.value.projectType;
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goData() {
        this.$state.go('projects.pipelineOther', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
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
