import PipelineVersionTemplate from './pipeline-version.template.html';
import PipelineVersionChangesTemplate from './pipeline-version-changes.template.html';

class PipelineVersionCtrl {
    constructor(
        FileOperationService,
        FileListingService,
        PublicationService,
        ProjectService,
        $state,
        $http,
        $q
    ) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.PublicationService = PublicationService;
        this.ProjectService = ProjectService;
        this.$state = $state;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.publication = this.ProjectService.resolveParams.publication;
        this.selectedListing = this.ProjectService.resolveParams.selectedListing; // for handling selected files...
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
                    license: this.publication.licenses,
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
        // need a notification banner for issues...
        // ex: missing selections/changelog or submission failure response
        if (!this.revisionText.length) {
            return this.ui.errorMessage = "We've encountered an error with your request...";
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
                selectedFiles: filePaths
            }
        ).then((resp) => {
            this.ui.submitted = true;
        }).finally( () => {
            this.ui.loading = false;
        });
    }

    saveSelections() {
        this.selectedListing = {
            ...this.FileListingService.listings.main,
            listing: this.FileListingService.getSelectedFiles('main'),
        };
        this.FileListingService.selectedListing = this.selectedListing;
    }

    undoSelections() {
        this.selectedListing = null;
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    goVersion() {
        this.$state.go('projects.pipelineVersion', { projectId: this.projectId }, { reload: true });
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
