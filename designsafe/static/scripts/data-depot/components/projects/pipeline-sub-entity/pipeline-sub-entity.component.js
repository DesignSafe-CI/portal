// fix pathing for these and update names in the index...
import PipelineSubEntityExpTemplate from './pipeline-sub-entity-exp.template.html';
import PipelineSubEntitySimTemplate from './pipeline-sub-entity-sim.template.html';
import PipelineSubEntityHybSimTemplate from './pipeline-sub-entity-hyb-sim.template.html';
import PipelineSubEntityFieldTemplate from './pipeline-sub-entity-field.template.html';

class PipelineSubEntityCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.primaryEntities = this.ProjectService.resolveParams.primaryEntities;
        this.browser.project = this.ProjectService.resolveParams.project;
        this.browser.listings = this.ProjectService.resolveParams.selectedListings;
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };
        this.ui = {
            loading: true,
        };


        if (!this.browser.project) {
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.browser.project = project;
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
        this.primEntDest = null;
        this.modalName = null;
        if (this.browser.project.value.projectType === 'experimental'){
            this.selectDest = 'projects.pipelineSelectExp';
            this.primEntDest = 'projects.pipelineExperiment';
            this.modalName = 'manageCategories';
            this.matchingGroupKey = 'experiments';
        }
        if (this.browser.project.value.projectType === 'simulation'){
            this.selectDest = 'projects.pipelineSelectSim';
            this.primEntDest = 'projects.pipelineSimulation';
            this.modalName = 'manageCategories';
            this.matchingGroupKey = 'simulations';
        }
        if (this.browser.project.value.projectType === 'hybrid_simulation'){
            this.selectDest = 'projects.pipelineSelectHybSim';
            this.primEntDest = 'projects.pipelineHybrid';
            this.modalName = 'manageCategories';
            this.matchingGroupKey = 'hybridSimulations';
        }
        if (this.browser.project.value.projectType === 'field_recon'){
            this.selectDest = 'projects.pipelineSelectField';
            this.primEntDest = 'projects.pipelineField';
            this.modalName = 'fieldReconCollectionsModal';
            this.matchingGroupKey = 'missions';
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }
    
    goPrimaryEntity() {
        this.$state.go(this.primEntDest, {
            projectId: this.projectId,
            project: this.browser.project,
            primaryEntities: this.primaryEntities,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.browser.project,
            primaryEntities: this.primaryEntities,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }

    editSubEntity(selection) {
        this.$uibModal.open({
            component: this.modalName,
            resolve: {
                browser: () => this.browser,
                project: () => this.browser.project,
                edit: () => selection,
            },
            size: 'lg',
        });
    }

    matchingGroup(primaryEnt, subEnt) {
        if (!primaryEnt) {
            // if the sub entity is related to the project and not a primary entity
            if (!subEnt.value[this.matchingGroupKey]) {
                return;
            } else if (subEnt.associationIds.indexOf(this.projectId) > -1 && !subEnt.value[this.matchingGroupKey].length) {
                return true;
            }
            return false;
        }
        // if the sub entity is related to the primary entity
        // match appropriate data to corresponding primary entity
        if (subEnt.associationIds.indexOf(primaryEnt.uuid) > -1) {
            return true;
        }
        return false;
    }
}

export const PipelineSubEntityExpComponent = {
    template: PipelineSubEntityExpTemplate,
    controller: PipelineSubEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineSubEntitySimComponent = {
    template: PipelineSubEntitySimTemplate,
    controller: PipelineSubEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineSubEntityHybSimComponent = {
    template: PipelineSubEntityHybSimTemplate,
    controller: PipelineSubEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineSubEntityFieldComponent = {
    template: PipelineSubEntityFieldTemplate,
    controller: PipelineSubEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
