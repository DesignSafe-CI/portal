import PipelineVersionTemplate from './pipeline-version.template.html';
import PipelineVersionProjectTemplate from './pipeline-version-project.template.html';
import PipelineVersionChangesTemplate from './pipeline-version-changes.template.html';

class PipelineVersionCtrl {
    constructor(
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
            confirmed: false
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
                this.authors = this.publication.project.value.teamOrder;
                this.pubData = {
                    project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                    license: this.publication.licenses
                };
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
        let filePaths = this.selectedListing.listing.map( file => file.path);
        this.$http.post(
            '/api/projects/publication/',
            {
                publication: this.pubData,
                status: 'publishing',
                revision: true,
                revisionText: this.revisionText,
                revisionAuthors: this.authors,
                selectedFiles: filePaths
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

    returnToProject() {
        this.$state.go('projects.view', { projectId: this.project.uuid }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    goVersion() {
        this.$state.go('projects.pipelineVersion', {
            projectId: this.projectId,
            publication: this.publication
        }, { reload: true });
    }

    goVersionProject() {
        this.$state.go('projects.pipelineVersionProject', {
            projectId: this.projectId,
            publication: this.publication,
            selectedListing: this.selectedListing
        }, { reload: true });
    }

    goVersionChanges() {
        this.$state.go('projects.pipelineVersionChanges', {
            projectId: this.projectId,
            publication: this.publication,
            selectedListing: this.selectedListing
        }, { reload: true });
    }
}

export const PipelineVersionComponent = {
    template: PipelineVersionTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineVersionProjectComponent = {
    template: PipelineVersionProjectTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineVersionChangesComponent = {
    template: PipelineVersionChangesTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
