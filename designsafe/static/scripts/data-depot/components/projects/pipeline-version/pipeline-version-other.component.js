import VersionOtherSelection from './version-other-selection.template.html';
import VersionOtherCitation from './version-other-citation.template.html';

class PipelineVersionOtherCtrl {
    constructor(
        FileOperationService,
        FileListingService,
        ProjectService,
        $uibModal,
        $state,
        $http,
        $q
    ) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
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
            confirmed: false
        };
        console.log('Hello PipelineVersionOtherCtrl');
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
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                }),
            ]).then(([project, listing]) => {
                this.project = project;
                this.listing = listing;
                this.pubData = {
                    project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                    license: this.publication.licenses
                };
                this.authors = this.publication.project.value.teamOrder
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
        this.navigate('projects.versionOtherSelection');
    }

    goCitation() {
        this.navigate('projects.versionOtherCitation');
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
    controller: PipelineVersionOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionOtherCitationComponent = {
    template: VersionOtherCitation,
    controller: PipelineVersionOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
