import PipelineExperimentTemplate from './pipeline-experiment.template.html';
import PipelineSimulationTemplate from './pipeline-simulation.template.html';
import PipelineHybridTemplate from './pipeline-hybrid.template.html';
import PipelineFieldReconTemplate from './pipeline-field-recon.template.html';
import experimentalData from '../../../../projects/components/facility-data.json';

class PipelinePrimaryEntityCtrl {

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
        this.ui = {
            efs: experimentalData.facility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            loading: true
        };
        if (!this.project) {
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.project = project;
                this.prepProject();
                this.ui.loading = false;
                this.$state.go(this.selectDest, {projectId: this.projectId}, {reload: true});
            });
        } else {
            this.ui.loading = false;
            this.prepProject();
        }
    }

    prepProject() {
        this.selectDest = null;
        this.subEntDest = null;
        this.modalName = null;
        if (this.project.value.projectType === 'experimental'){
            this.selectDest = 'projects.pipelineSelectExp';
            this.subEntDest = 'projects.pipelineSubEntityExp';
            this.modalName = 'manageExperimentsModal';
        }
        if (this.project.value.projectType === 'simulation'){
            this.selectDest = 'projects.pipelineSelectSim';
            this.subEntDest = 'projects.pipelineSubEntitySim';
            this.modalName = 'manageSimulationsModal';
        }
        if (this.project.value.projectType === 'hybrid_simulation'){
            this.selectDest = 'projects.pipelineSelectHybSim';
            this.subEntDest = 'projects.pipelineSubEntityHybSim';
            this.modalName = 'manageHybridSimulationsModal';
        }
        if (this.project.value.projectType === 'field_recon'){
            this.selectDest = 'projects.pipelineSelectField';
            this.subEntDest = 'projects.pipelineSubEntityField';
            this.modalName = 'fieldReconMissionsModal';
        }
    }

    getEF(str) {
        if (str !='' && str !='None') {
            let efs = this.ui.efs.facilities_list;
            let ef = efs.find((ef) => {
                return ef.name === str;
            });
            return ef.label;
        }
    }

    getET(exp) {
        if (exp.value.experimentalFacility == 'ohhwrl-oregon' || exp.value.experimentalFacility == 'eqss-utaustin' ||
        exp.value.experimentalFacility == 'cgm-ucdavis' || exp.value.experimentalFacility == 'lhpost-sandiego' ||        
        exp.value.experimentalFacility == 'rtmd-lehigh' || exp.value.experimentalFacility == 'pfsml-florida' ||
        exp.value.experimentalFacility == 'wwhr-florida' || exp.value.experimentalFacility == 'other') 
            {
            let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
            let et = ets.find((x) => {
                return x.name === exp.value.experimentType;
            });
            return et.label;
        }
    }

    getEQ(exp) {
        if (exp.value.experimentalFacility == 'ohhwrl-oregon' || exp.value.experimentalFacility == 'eqss-utaustin' ||
        exp.value.experimentalFacility == 'cgm-ucdavis' || exp.value.experimentalFacility == 'lhpost-sandiego' ||        
        exp.value.experimentalFacility == 'rtmd-lehigh' || exp.value.experimentalFacility == 'pfsml-florida' ||
        exp.value.experimentalFacility == 'wwhr-florida' || exp.value.experimentalFacility == 'other') 
            {
            let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
            let eqt = eqts.find((x) => {
                return x.name === exp.value.equipmentType;
            });
            return eqt.label;
        }
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.project,
            primaryEntities: this.primaryEntities,
            secondaryEntities: this.secondaryEntities,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goSubEntities() {
        this.$state.go(this.subEntDest, {
            projectId: this.projectId,
            project: this.project,
            primaryEntities: this.primaryEntities,
            secondaryEntities: this.secondaryEntities,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    managePrimaryEntity(selectedEnt) {
        this.$uibModal.open({
            component: this.modalName,
            resolve: {
                project: () => { return this.project; },
                edit: () => { return selectedEnt; },
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

}

export const PipelineExperimentComponent = {
    template: PipelineExperimentTemplate,
    controller: PipelinePrimaryEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineFieldComponent = {
    template: PipelineFieldReconTemplate,
    controller: PipelinePrimaryEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineHybridComponent = {
    template: PipelineHybridTemplate,
    controller: PipelinePrimaryEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineSimulationComponent = {
    template: PipelineSimulationTemplate,
    controller: PipelinePrimaryEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
