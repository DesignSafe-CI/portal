import VersionChanges from './version-changes.template.html';
import PublicationMapping from '../mapping/publication-mapping.json'

class PipelineVersionChangesCtrl {
    constructor(
        ProjectService,
        $uibModal,
        $state,
        $http,
        $q
    ) {
        'ngInject';
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
            selectionComp: '',
            citationComp: ''
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.publication = this.ProjectService.resolveParams.publication;
        this.selectedEnts = this.ProjectService.resolveParams.selectedEnts;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.revisionAuthors = this.ProjectService.resolveParams.revisionAuthors;
        this.revisionSelections = [];
        this.revisionText = '';

        if (!this.publication || !this.project) {
            this.goStart();
        } else {
            this.pubData = {
                project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                license: this.publication.licenses
            };
            this.prjType = this.project.value.projectType;
            if (this.prjType !== 'other') {
                this.revisionSelections = this.selectedEnts.map((ent) => {
                    return {title: ent.value.title, selected: false}
                });
                let uuids = Object.keys(this.selectedListings);
                uuids.forEach((uuid) => {
                    let listing = this.selectedListings[uuid];
                    let entity = this.project.getRelatedByUuid(uuid);
                    let attr = PublicationMapping[entity.name];
                    let pubEntity = { name: entity.name, uuid: entity.uuid };
                    pubEntity.fileObjs = listing.listing.map((file) => {
                        return {
                            name: file.name,
                            path: file.path,
                            system: file.system,
                            type: file.type,
                        };
                    });
                    if (!this.pubData[attr] ||
                        this.pubData[attr].length === 0 ||
                        typeof this.pubData[attr] === 'undefined') {
                        this.pubData[attr] = [];
                    }
                    this.pubData[attr].push(pubEntity);
                });
    
                this.mainEntityUuids = [];
                if (this.prjType === 'experimental') {
                    this.ui.selectionComp = 'projects.versionExperimentSelection'
                    this.ui.citationComp = 'projects.versionCitation'

                    this.pubData['experimentsList'] = [];
                    this.selectedEnts.forEach((entity) => {
                        this.pubData['experimentsList'].push({uuid: entity.uuid});
                        this.mainEntityUuids.push(entity.uuid);
                    });
                }
                if (this.prjType === 'field_recon') {
                    this.ui.selectionComp = 'projects.versionFieldReconSelection'
                    this.ui.citationComp = 'projects.versionCitation'

                    this.pubData['missions'] = [];
                    this.selectedEnts.forEach((entity) => {
                        if (entity.name === 'designsafe.project.field_recon.mission') {
                            this.pubData['missions'].push({uuid: entity.uuid});
                        }
                        this.mainEntityUuids.push(entity.uuid);
                    });
                }
                if (this.prjType === 'simulation') {
                    this.ui.selectionComp = 'projects.versionSimulationSelection'
                    this.ui.citationComp = 'projects.versionCitation'

                    this.pubData['simulations'] = [];
                    this.selectedEnts.forEach((entity) => {
                        this.pubData['simulations'].push({uuid: entity.uuid});
                        this.mainEntityUuids.push(entity.uuid);
                    });
                }
                if (this.prjType === 'hybrid_simulation') {
                    this.ui.selectionComp = 'projects.versionHybSimSelection'
                    this.ui.citationComp = 'projects.versionCitation'

                    this.pubData['hybrid_simulations'] = [];
                    this.selectedEnts.forEach((entity) => {
                        this.pubData['hybrid_simulations'].push({uuid: entity.uuid});
                        this.mainEntityUuids.push(entity.uuid);
                    });
                }
            } else {
                this.revisionAuthors = this.publication.project.value.teamOrder
                this.ui.selectionComp = 'projects.versionOtherSelection'
                this.ui.citationComp = 'projects.versionOtherCitation'
            }
            this.ui.loading = false;
        }
    }

    submitVersion() {
        this.ui.warning = false;
        if (this.revisionText.length < 10) {
            return this.ui.warning = true;
        }
        this.revisionTitles = [];
        if (this.prjType !== 'other') {
            this.revisionTitles = this.revisionSelections
                .filter((item) => item.selected)
                .map((item) => item.title);
            if (!this.revisionTitles.length) return this.ui.warning = true;
        }
        this.ui.loading = true;
        let filePaths = ( (this.selectedListings && this.selectedListings.listing)
            ? this.selectedListings.listing.map((file) => file.path)
            : null);
        this.$http.post(
            '/api/projects/publication/',
            {
                publication: this.pubData,
                mainEntityUuids: this.mainEntityUuids,
                selectedFiles: filePaths,
                revision: true,
                revisionText: this.revisionText,
                revisionTitles: this.revisionTitles,
                revisionAuthors: this.revisionAuthors,
                status: 'publishing'
            }
        ).then((resp) => {
            this.ui.success = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        }, (error) => {
            this.ui.error = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        });
    }

    configureSelections(selections) {
        selections.map((ent) => {
            return {title: ent.value.title, selected: false}
        });
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
        this.navigate(this.ui.selectionComp);
    }

    goCitation() {
        this.navigate(this.ui.citationComp);
    }

    goProject() {
        this.navigate('projects.view');
    }
}

export const VersionChangesComponent = {
    template: VersionChanges,
    controller: PipelineVersionChangesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
