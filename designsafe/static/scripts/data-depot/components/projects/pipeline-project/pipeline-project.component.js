import { missing } from 'tv4';
import PipelineProjectTemplate from './pipeline-project.component.html';

class PipelineProjectCtrl {

    constructor(ProjectService, $uibModal, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.ui = {
            showEdit: true,
            showOverview: false,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.primaryEntities = this.ProjectService.resolveParams.primaryEntities;
        this.secondaryEntities = this.ProjectService.resolveParams.secondaryEntities;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.projType = project.value.projectType;
                this.uuid = project.uuid;
                if (this.projType === 'experimental') {
                    this.$state.go('projects.pipelineSelectExp', { projectId: this.uuid }, { reload: true });
                } else if (this.projType === 'simulation') {
                    this.$state.go('projects.pipelineSelectSim', { projectId: this.uuid }, { reload: true });
                } else if (this.projType === 'hybrid_simulation') {
                    this.$state.go('projects.pipelineSelectHybSim', { projectId: this.uuid }, { reload: true });
                } else if (this.projType === 'field_recon') {
                    this.$state.go('projects.pipelineSelectField', { projectId: this.uuid }, { reload: true });
                } else if (this.projType === 'other') {
                    this.$state.go('projects.pipelineStart', { projectId: this.uuid }, { reload: true });
                }
            });
        } else {
            this.projType = this.project.value.projectType;
            if (this.projType === 'experimental') {
                this.placeholder = 'Experiment';
            } else if (this.projType === 'simulation') {
                this.placeholder = 'Simulation';
            } else if (this.projType === 'hybrid_simulation') {
                this.placeholder = 'Hybrid Sim';
            } else if (this.projType === 'field_recon') {
                this.placeholder = 'Mission';
            }
        }

    }

    checkProjectMetadata(project){
        let required = {
            'title' : 'Title',
            'projectType': 'Project Type',
            'nhTypes': 'Natural Hazard Type',
            'frTypes': 'Field Research Type',
            'dataType': 'Data Type',
            'keywords': 'Keywords',
            'description': 'Description'
        }
        let missing_fields = [];

        for (var field in project.value) {
            if (required[field]) {
                if (project.value[field] === '' || !project.value[field].length) {
                    missing_fields.push(required[field]);
                }
            }
        }

        return missing_fields;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view', {projectId: this.project.uuid}, {reload: true});
    }

    goSelection() {
        if (this.projType === 'experimental') {
            this.$state.go('projects.pipelineSelectExp', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'simulation') {
            this.$state.go('projects.pipelineSelectSim', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'hybrid_simulation') {
            this.$state.go('projects.pipelineSelectHybSim', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'field_recon') {
            this.$state.go('projects.pipelineSelectField', {projectId: this.project.uuid}, {reload: true});
        } else if (this.projType === 'other') {
            this.$state.go('projects.pipelineSelectOther', {projectId: this.project.uuid}, {reload: true});
        }
    }

    goExperiment() {
        //check for missing required project metadata
        this.missingMetadata = this.checkProjectMetadata(this.project);
        if(this.missingMetadata.length) {
            return;
        }

        if (this.projType === 'experimental') {
            this.$state.go('projects.pipelineExperiment', {
                projectId: this.projectId,
                project: this.project,
                primaryEntities: this.primaryEntities,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'simulation') {
            this.$state.go('projects.pipelineSimulation', {
                projectId: this.projectId,
                project: this.project,
                primaryEntities: this.primaryEntities,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'hybrid_simulation') {
            this.$state.go('projects.pipelineHybrid', {
                projectId: this.projectId,
                project: this.project,
                primaryEntities: this.primaryEntities,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'field_recon') {
            this.$state.go('projects.pipelineField', {
                projectId: this.projectId,
                project: this.project,
                primaryEntities: this.primaryEntities,
                secondaryEntities: this.secondaryEntities,
                selectedListings: this.selectedListings,
            }, {reload: true});
        } else if (this.projType === 'other') {
            this.$state.go('projects.pipelineOther', {
                projectId: this.projectId,
                project: this.project,
                selectedListings: this.selectedListings,
            }, {reload: true});
        }
    }

    manageProject() {
        return this.$uibModal.open({
            component: 'manageProject',
            resolve: {
                project: () => this.project,
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

}

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
