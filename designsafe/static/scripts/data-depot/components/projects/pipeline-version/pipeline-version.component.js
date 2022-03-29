import VersionExperimentSelectionTemplate from './version-experimental-selection.template.html';
import VersionExperimentCitationTemplate from './version-experimental-citation.template.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PipelineVersionCtrl {
    constructor(
        ProjectEntitiesService,
        FileOperationService,
        FileListingService,
        PublicationService,
        ProjectService,
        $uibModal,
        $state,
        $http,
        $q
    ) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.PublicationService = PublicationService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true,
            success: false,
            warning: false,
            error: false,
            submitted: false,
            confirmed: false,
            selectionComp: '',
            citationComp: '',
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.publication = this.ProjectService.resolveParams.publication;
        this.selectedListing = this.ProjectService.resolveParams.selectedListing;
        this.revisionText = '';
        if (!this.publication) {
            this.goStart();
        } else {
            this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
            ])
            .then(([project, entities]) => {
                this.project = project;
                this.project.appendEntitiesRel(entities);
                const prjType = this.project.value.projectType;
                if (prjType === 'experimental') {
                    this.ui.selectionComp = 'projects.versionSelection'
                    this.ui.citationComp = 'projects.versionCitation'
                    this.matchingGroupKey = 'experiments'
                } else {
                    this.goStart();
                }
                return this.FileListingService.abstractListing(entities, project.uuid);
            }).then((_) => {
                this.ui.loading = false;
            });
        }
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

    getEF(str) {
        let efs = this.ui.efs[this.project.value.projectType];
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    matchingGroup(primaryEnt, subEnt) {
        if (!primaryEnt) {
            // if the sub entity is related to the project and not a primary entity
            if (!subEnt.value[this.matchingGroupKey]) {
                return;
            } else if (
                subEnt.associationIds.indexOf(this.projectId) > -1 &&
                !subEnt.value[this.matchingGroupKey].length
            ) {
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

    // saveAuthors() {
    //     this.ui.confirmed = true;
    // }

    // saveSelections() {
    //     let selectedFiles = this.FileListingService.getSelectedFiles('main')
    //     if (!selectedFiles.length) {
    //         return;
    //     }
    //     this.selectedListing = {
    //         ...this.FileListingService.listings.main,
    //         listing: selectedFiles,
    //     };
    //     this.FileListingService.selectedListing = this.selectedListing;
    // }

    // undoSelections() {
    //     this.selectedListing = null;
    // }

    navigate(destCompName) {
        let params = {
            projectId: this.projectId,
            publication: this.publication,
            selectedListing: this.selectedListing
        }
        this.$state.go(destCompName, params, { reload: true });
    }

    goStart() {
        this.navigate('projects.pipelineStart');
    }
    
    goSelection() {
        this.navigate(this.ui.selectionComp);
    }

    goCitation() {
        this.navigate('projects.versionExperimentSelection');
    }

    goChanges() {
        this.navigate('projects.versionExperimentChanges');
    }

    goProject() {
        this.navigate('projects.view');
    }
}


export const VersionExperimentSelectionComponent = {
    template: VersionExperimentSelectionTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionExperimentCitationComponent = {
    template: VersionExperimentCitationTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
