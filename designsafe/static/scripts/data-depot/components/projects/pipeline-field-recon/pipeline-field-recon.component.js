import PipelineFieldReconTemplate from './pipeline-field-recon.component.html';
import _ from 'underscore';

class PipelineFieldReconCtrl {

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
        this.mission = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelectFieldRecon', {projectId: this.projectId}, {reload: true});
        }
    }

    hasEndDate(date) {
        if (Date.parse(date)) {
            return true;
        }
        return false;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.mission,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategoriesFieldRecon', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.mission,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    editExp() {
        this.$uibModal.open({
            component: 'fieldReconMissionsModal',
            resolve: {
                project: () => { return this.project; },
                collections: () => { return this.project.collections_set; },
                edit: () => { this.mission; },
            },
            size: 'lg',
        });
    }

}

export const PipelineFieldReconComponent = {
    template: PipelineFieldReconTemplate,
    controller: PipelineFieldReconCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    }
};
