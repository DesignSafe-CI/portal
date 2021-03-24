import PipelineVersionTemplate from './pipeline-version.template.html';
import PipelineVersionChangesTemplate from './pipeline-version-changes.template.html';

class PipelineVersionCtrl {
    constructor(
        FileOperationService,
        FileListingService,
        ProjectService,
        $state,
        $q
    ) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.ProjectService = ProjectService;
        this.$state = $state;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.selectedListing = null; // for handling selected files...
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
            this.ui.loading = false;
        });
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
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
        this.$state.go('projects.pipelineVersionChanges', { projectId: this.projectId }, { reload: true });
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
