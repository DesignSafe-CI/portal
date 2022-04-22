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
        this.revisionText = '';

        if (!this.publication || !this.project) {
            this.goStart();
        } else {
            this.pubData = {
                project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                license: this.publication.licenses
            };
            if (this.project.value.projectType !== 'other') {
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
    
                let entityListName = '';
                this.mainEntityUuids = [];
                if (this.project.value.projectType === 'experimental') {
                    entityListName = 'experimentsList';
                    this.ui.selectionComp = 'projects.versionExperimentSelection'
                    this.ui.citationComp = 'projects.versionExperimentCitation'
                }
                this.pubData[entityListName] = [];
                this.selectedEnts.forEach((entity) => {
                    this.pubData[entityListName].push({uuid: entity.uuid});
                    this.mainEntityUuids.push(entity.uuid);
                });
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
        this.ui.loading = true;
        let filePaths = (this.selectedListing
            ? this.selectedListing.listing.map((file) => file.path)
            : null);
        this.$http.post(
            '/api/projects/publication/',
            {
                publication: this.pubData,
                mainEntityUuids: this.mainEntityUuids,
                selectedFiles: filePaths,
                revision: true,
                revisionText: this.revisionText,
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
