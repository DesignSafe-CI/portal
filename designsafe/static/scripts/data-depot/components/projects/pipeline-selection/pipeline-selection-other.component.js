import PipelineSelectionOtherTemplate from './pipeline-selection-other.component.html';

class PipelineSelectionOtherCtrl {

    constructor(ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.ui = {
            loading: true,
        };

        this.selectedListing = null;
        
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
            this.browser.project = project;
            this.browser.listing = listing;
            this.ui.loading = false;
        });
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view', {projectId: this.projectId}, {reload: true});
    }

    goPreview() {
        this.$state.go('projects.previewOther', {projectId: this.projectId}, {reload: true});
    }

    goProject() {
        window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.browser.project,
            selectedListings: this.selectedListing
        }, {reload: true});
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

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

}

export const PipelineSelectionOtherComponent = {
    template: PipelineSelectionOtherTemplate,
    controller: PipelineSelectionOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
