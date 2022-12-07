import PipelineLicensesTemplate from './pipeline-licenses.component.html';

class PipelineLicensesCtrl {

    constructor(ProjectService, $uibModal, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.primaryEntities = this.ProjectService.resolveParams.primaryEntities;
        this.secondaryEntities = this.ProjectService.resolveParams.secondaryEntities;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.selectedLicense = '';
        this.ui = {
            loading: true
        };

        if (!this.project) {
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.project = project;
                this.prepProject();
                this.ui.loading = false;
                this.$state.go(this.selectDest, { projectId: this.projectId }, { reload: true });
            });
        } else {
            this.prepProject();
            this.ui.loading = false;
        }
    }

    prepProject() {
        this.selectDest = null;
        this.placeholder = 'Entity';
        if (this.project.value.projectType === 'experimental'){
            this.selectDest = 'projects.pipelineSelectExp';
            this.placeholder = 'Experiment';
        } else if (this.project.value.projectType === 'simulation'){
            this.selectDest = 'projects.pipelineSelectSim';
            this.placeholder = 'Simulation';
        } else if (this.project.value.projectType === 'hybrid_simulation'){
            this.selectDest = 'projects.pipelineSelectHybSim';
            this.placeholder = 'Hybrid Simulation';
        } else if (this.project.value.projectType === 'field_recon'){
            this.selectDest = 'projects.pipelineSelectField';
            this.placeholder = 'Mission';
        } else if (this.project.value.projectType === 'other') {
            this.selectDest = 'projects.pipelineStart';
        }
    }

    validSelection() {
        if (this.project) {
            if (typeof this.project.value.projectType === 'undefined') {
                return false;
            }
            if (this.selectedLicense) {
                return true;
            }
            return false;
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go(
            'projects.view',
            { projectId: this.project.uuid },
            { reload: true }
        );
    }

    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.project,
            primaryEntities: this.primaryEntities,
            secondaryEntities: this.secondaryEntities,
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
        }, { reload: true });
    }

    // Modal for accept and publish...
    prepareModal() {
        // Ugly fix to revert original license design without changing the schema
        this.license = {
            datasets: ['Open Data Commons Attribution', 'Open Data Commons Public Domain Dedication'],
            works: ['Creative Commons Attribution', 'Creative Commons Public Domain Dedication'],
            software: ['GNU General Public License'],
        };
        Object.keys(this.license).forEach((key) => {
            this.license[key] = (this.license[key].includes(this.selectedLicense)
                ? this.selectedLicense
                : ''
            )
        });

        if (this.project.value.projectType === 'field_recon'){
            this.$uibModal.open({
                component: 'pipelinePrivacyPublishModal',
                resolve: {
                    project: () => { return this.project; },
                    resolveParams: () => { return this.ProjectService.resolveParams; },
                    license: () => { return this.license; },
                },
                size: 'lg',
            });
        } else {
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
}

export const PipelineLicensesComponent = {
    template: PipelineLicensesTemplate,
    controller: PipelineLicensesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
