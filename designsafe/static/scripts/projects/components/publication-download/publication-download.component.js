import PublicationDownloadModalTemplate from './publication-download.template.html';

class PublicationDownloadModalCtrl {

    constructor(FileListingService, FileOperationService, $http) {
        'ngInject';
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.$http = $http;
    }

    $onInit() {
        this.loaded = null;
        this.error = null;
        this.retrievingPostit = null;
        this.publication = this.resolve.publication;
        this.prjId = this.publication.project.value.projectId;
        
        const archive_path = (this.publication.revision
            ? `/archives/${this.prjId}r${this.publication.revision}_archive.zip`
            : `/archives/${this.prjId}_archive.zip`
        )
        const archive_system = 'designsafe.storage.published'

        this.FileListingService.getDetail({
            api: 'agave',
            scheme: 'public',
            system: archive_system,
            path: archive_path,
        })
            .then((resp) => {
                this.arcData = resp.data;
            })
            .finally(() => {
                if (!this.arcData) {
                    this.error = true;
                }
                this.loaded = true;
            });
    }

    download() {
        this.retrievingPostit = true;
        const files = [this.arcData]
        this.FileOperationService.download({ api: 'agave', scheme: 'public', files }).then(
            (_) => (this.retrievingPostit = false)
        );
        this.FileOperationService.microsurvey({projectId: this.prjId})
    }

    cancel() {
        this.close();
    }


}

export const PublicationDownloadModalComponent = {
    template: PublicationDownloadModalTemplate,
    controller: PublicationDownloadModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
