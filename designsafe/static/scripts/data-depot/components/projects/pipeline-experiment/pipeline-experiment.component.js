import PipelineExperimentTemplate from './pipeline-experiment.component.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';
import _ from 'underscore';

class PipelineExperimentCtrl {

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
        this.ui = {
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes
        };

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.$state.go('projects.pipelineSelect', {projectId: this.projectId}, {reload: true});
        }
    }

    getEF(str) {
        let efs = this.ui.efs[this.project.value.projectType];
        let ef = _.find(efs, (ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = _.find(ets, (x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = _.find(eqts, (x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
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
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    manageExperiments() {
        this.$uibModal.open({
            component: 'manageExperimentsModal',
            resolve: {
                project: () => { return this.project; },
                edit: () => { return this.experiment; },
            },
            size: 'lg',
        });
    }

}

export const PipelineExperimentComponent = {
    template: PipelineExperimentTemplate,
    controller: PipelineExperimentCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
