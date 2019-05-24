import PipelineLicensesTemplate from './pipeline-licenses.component.html';

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
        this.license = {
            datasets: '',
            works: '',
            software: ''
        };

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
                    this.$state.go(
                        'projects.pipelineSelect',
                        { projectId: this.uuid },
                        { reload: true }
                    );
                } else if (this.projType === 'simulation') {
                    this.$state.go(
                        'projects.pipelineSelectSim',
                        { projectId: this.uuid },
                        { reload: true }
                    );
                } else if (this.projType === 'hybrid_simulation') {
                    this.$state.go(
                        'projects.pipelineSelectHybSim',
                        { projectId: this.uuid },
                        { reload: true }
                    );
                } else if (this.projType === 'other') {
                    this.$state.go(
                        'projects.pipelineSelectOther',
                        { projectId: this.uuid },
                        { reload: true }
                    );
                }
            });
        } else {
            this.projType = this.project.value.projectType;
            if (this.projType === 'experimental') {
                this.placeholder = 'Experiment';
            } else if (this.projType === 'simulation') {
                this.placeholder = 'Simulation';
            } else if (this.projType === 'hybrid_simulation') {
                this.placeholder = 'Hybrid Simulation';
            } else if (this.projType === 'field_recon') {
                this.placeholder = 'Mission';
            }
        }
    }

    validSelection() {
        if (typeof this.projectType === 'undefined' ||
            this.projectType === 'field_recon') {
                return false;
        }
        if (this.license.datasets ||
            this.license.works ||
            this.license.software) {
                return true;
        } else {
            return false;
        }
    }

    reset() {
        var ids = [
        'odca',
        'odcpdd',
        'ccasa',
        'ccpdd',
        'gnu'
        ];
        ids.forEach((id) => {
            document.getElementById(id).checked = false;
        });
        this.license = {
            datasets: '',
            works: '',
            software: ''
        };
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go(
            'projects.view.data',
            { projectId: this.project.uuid },
            { reload: true }
        );
    }

    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, { reload: true });
    }

    goData() {
        this.$state.go('projects.pipelineOther', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, { reload: true });
    }

    goTeam() {
        this.$state.go('projects.pipelineTeam', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    // Modal for accept and publish...
    prepareModal() {
        this.$uibModal.open({
            component: 'pipelinePublishModal',
            resolve: {
                project: () => { return this.project; },
                resolveParams: () => { return this.ProjectService.resolveParams; },
                license: () => { return this.license; },
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
