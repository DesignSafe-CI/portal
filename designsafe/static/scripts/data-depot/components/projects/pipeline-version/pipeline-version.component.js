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
            confirmed: false,
            selectionComp: '',
            citationComp: '',
            placeholder: '',
            savedStatus: {},
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.publication = this.ProjectService.resolveParams.publication;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.selectedEnts = this.ProjectService.resolveParams.selectedEnts;
        this.revisionAuthors = {}
        this.selectedAuthor = '';
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
                    this.ui.placeholder = 'Experiment'
                    this.matchingGroupKey = 'experiments'
                    this.publishedKeyNames = ['experimentsList']
                    this.subEntities = ['modelconfig_set', 'sensorlist_set', 'event_set', 'report_set', 'analysis_set'];
                } else {
                    this.goStart();
                }
                this.FileListingService.abstractListing(entities, project.uuid).then((_) => {
                    // autoselect the published entities from the project
                    if (!this.selectedEnts.length) {
                        entities.forEach((ent) => {
                            if ('dois' in ent.value && ent.value.dois.length) {
                                this.selectEntity(ent);
                            }
                        })
                    } else {
                        this.configureCitations();
                    }
                    this.ui.loading = false;
                })
            });
        }
    }

    configureCitations() {
        this.selectedEnts.forEach((ent) => {
            this.revisionAuthors[ent.uuid] = ent.value.authors;
            this.ui.savedStatus[ent.uuid] = false;
        })

        this.publishedKeyNames.forEach((key) => {
            this.publication[key].forEach((pubEnt) => {
                if (pubEnt.uuid in this.revisionAuthors) {
                    this.revisionAuthors[pubEnt.uuid] = pubEnt.authors;
                }
            });
        });
    }

    saveAuthors(entity, status) {
        this.ui.savedStatus[entity.uuid] = status;
        let statuses = Object.values(this.ui.savedStatus);
        if (statuses.every(value => value === true)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.ui.confirmed = true;
        } else {
            this.ui.confirmed = false;
        }
    }

    orderAuthors(up, entity) {
        var a;
        var b;
        this.saveAuthors(entity, false)
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.revisionAuthors[entity.uuid].find(x => x.order === this.selectedAuthor.order - 1);
            b = this.revisionAuthors[entity.uuid].find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= this.revisionAuthors[entity.uuid].length - 1) {
                return;
            }
            // move down
            a = this.revisionAuthors[entity.uuid].find(x => x.order === this.selectedAuthor.order + 1);
            b = this.revisionAuthors[entity.uuid].find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
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
        let listing = {};
        Object.keys(this.FileListingService.listings).forEach((key) => {
            if (this.FileListingService.listings[key].selectedForPublication) {
                listing[key] = { ...this.FileListingService.listings[key] };
            } else {
                delete listing[key];
            }
        });
        return listing;
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
            selectedEnts: this.selectedEnts,
            selectedListings: this.selectedListings,
            revisionAuthors: this.revisionAuthors
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
        this.selectedListings = this.gatherSelections();
        this.missing = this.ProjectService.checkSelectedFiles(
            this.project,
            this.selectedEnts,
            this.selectedListings
        );
        if (this.missing.length) { return };
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
