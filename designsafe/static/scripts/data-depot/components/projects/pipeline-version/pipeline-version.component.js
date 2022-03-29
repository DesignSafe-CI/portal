import VersionExperimentSelectionTemplate from './version-experiment-selection.template.html';
import VersionExperimentCitationTemplate from './version-experiment-citation.template.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PipelineVersionCtrl {
    constructor(
        ProjectEntitiesService,
        FileOperationService,
        FileListingService,
        ProjectService,
        $state,
        $q
    ) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.ProjectService = ProjectService;
        this.$state = $state;
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
        this.selectedEnts = [];
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
                    this.subEntities = ['modelconfig_set', 'sensorlist_set', 'event_set', 'report_set', 'analysis_set'];
                } else {
                    this.goStart();
                }
                this.FileListingService.abstractListing(entities, project.uuid).then((_) => {
                    // autoselect the published entities from the project
                    entities.forEach((ent) => {
                        if ('dois' in ent.value && ent.value.dois.length) {
                            this.selectEntity(ent);
                        }
                    })
                    this.ui.loading = false;
                })
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

    gatherSelections() {
        this.selectedListings = {};
        Object.keys(this.FileListingService.listings).forEach((key) => {
            if (this.FileListingService.listings[key].selectedForPublication) {
                this.selectedListings[key] = { ...this.FileListingService.listings[key] };
            } else {
                delete this.selectedListings[key];
            }
        });
    }

    selectEntity(ent) {
        let uuidsToSelect = [];
        if (this.selectedEnts.find((selEnt) => selEnt.uuid === ent.uuid)) {
            this.selectedEnts = this.selectedEnts.filter((selEnt) => selEnt.uuid !== ent.uuid);
        } else {
            this.selectedEnts.push(ent);
        }
        this.selectedEnts.forEach((sEnt) => {
            uuidsToSelect.push(sEnt.uuid);
        });

        // iterate over subEntities and select files related to primary entity...
        if (ent.name.endsWith('field_recon.report')) {
            if (uuidsToSelect.includes(ent.uuid)) {
                this.FileListingService.setPublicationSelection(ent.uuid, true);
            } else {
                this.FileListingService.setPublicationSelection(ent.uuid, false);
            }
        } else {
            this.subEntities.forEach((subEntSet) => {
                if (this.project[subEntSet]) {
                    this.project[subEntSet].forEach((subEnt) => {
                        if (subEnt.associationIds.some((uuid) => uuidsToSelect.includes(uuid))) {
                            this.FileListingService.setPublicationSelection(subEnt.uuid, true);
                        } else {
                            this.FileListingService.setPublicationSelection(subEnt.uuid, false);
                        }
                    });
                }
            });
        }
    }

    navigate(destCompName) {
        let params = {
            projectId: this.projectId,
            project: this.project,
            publication: this.publication,
            selectedListing: this.selectedListing
        }
        this.$state.go(destCompName, params, { reload: true });
    }

    goStart() {
        this.navigate('projects.pipelineStart');
    }
    
    goSelection() {
        this.navigate('projects.versionExperimentSelection');
    }

    goCitation() {
        this.gatherSelections();
        this.missing = this.ProjectService.checkSelectedFiles(
            this.project,
            this.selectedEnts,
            this.selectedListings
        );
        this.navigate('projects.versionExperimentCitation');
    }

    goChanges() {
        this.navigate('projects.versionChanges');
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
