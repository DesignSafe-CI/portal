import PipelineProjectTemplate from './pipeline-project.component.html';
import _ from 'underscore';

class PipelineProjectCtrl {

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

    goSelection() {
        if (this.projType === 'experimental') {
            this.$state.go('projects.pipelineSelect', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'simulation') {
            this.$state.go('projects.pipelineSelectSim', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'hybrid_simulation') {
            this.$state.go('projects.pipelineSelectHybSim', {projectId: this.project.uuid}, {reload: true});
        }
    }

    goExperiment() {
        if (this.projType === 'experimental') {
            this.$state.go('projects.pipelineExperiment', {
                projectId: this.projectId,
                project: this.project,
                experiment: this.experiment,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'simulation') {
            this.$state.go('projects.pipelineSimulation', {
                projectId: this.projectId,
                project: this.project,
                experiment: this.experiment,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'hybrid_simulation') {
            this.$state.go('projects.pipelineHybrid', {
                projectId: this.projectId,
                project: this.project,
                experiment: this.experiment,
                selectedListings: this.selectedListings,
            }, {reload: true});
        }
    }

    editProject() {
        this.ProjectService.editProject(this.project);
    }

}

PipelineProjectCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineProjectComponent = {
    template: PipelineProjectTemplate,
    controller: PipelineProjectCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
