import VersionOtherSelection from './version-other-selection.template.html';
import VersionOtherCitation from './version-other-citation.template.html';
import VersionExperimentalSelection from './version-experimental-selection.template.html';
import VersionExperimentalCitation from './version-experimental-citation.template.html';
import VersionChanges from './version-changes.template.html';

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
            citationComp: ''
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
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                }),
            ]).then(([project, entities, listing]) => {
                this.project = project;
                this.project.appendEntitiesRel(entities);
                this.listing = listing;
                this.pubData = {
                    project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                    license: this.publication.licenses
                };
                switch(this.project.value.projectType) {
                    case 'experimental': {
                        this.authors = {}
                        this.project.experiment_set.forEach((exp) => {
                            this.authors[exp.uuid] = exp.value.authors
                        });
                        this.ui.selectionComp = 'projects.versionExperimentalSelection'
                        this.ui.citationComp = 'projects.versionExperimentalCitation'
                        break;
                    }
                    case 'other': {
                        this.authors = this.publication.project.value.teamOrder
                        this.ui.selectionComp = 'projects.versionOtherSelection'
                        this.ui.citationComp = 'projects.versionOtherCitation'
                    }
                }
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
                revisionAuthors: this.authors,
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

    saveAuthors() {
        this.ui.confirmed = true;
    }

    saveSelections() {
        let selectedFiles = this.FileListingService.getSelectedFiles('main')
        if (!selectedFiles.length) {
            return;
        }
        this.selectedListing = {
            ...this.FileListingService.listings.main,
            listing: selectedFiles,
        };
        this.FileListingService.selectedListing = this.selectedListing;
    }

    undoSelections() {
        this.selectedListing = null;
    }

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
        this.navigate(this.ui.citationComp);
    }

    goChanges() {
        this.navigate('projects.versionChanges');
    }

    goProject() {
        this.navigate('projects.view');
    }
}

export const VersionOtherSelectionComponent = {
    template: VersionOtherSelection,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionOtherCitationComponent = {
    template: VersionOtherCitation,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionExperimentalSelectionComponent = {
    template: VersionExperimentalSelection,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionExperimentalCitationComponent = {
    template: VersionExperimentalCitation,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionChangesComponent = {
    template: VersionChanges,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
