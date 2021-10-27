import PublicationDownloadModalTemplate from './publication-download.template.html';

class PublicationDownloadModalCtrl {

    constructor(FileListingService, FileOperationService, $http, $q) {
        'ngInject';
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.loaded = null;
        this.error = null;
        this.retrievingPostit = null;
        this.publication = this.resolve.publication;
        this.prjId = this.publication.project.value.projectId;
        
        const archiveSystem = 'designsafe.storage.published'
        const archivePath = (this.publication.revision
            ? `/archives/${this.prjId}v${this.publication.revision}_archive.zip`
            : `/archives/${this.prjId}_archive.zip`
        )
        const archiveMetaPath = (this.publication.revision
            ? `/archives/${this.prjId}v${this.publication.revision}_metadata.json`
            : `/archives/${this.prjId}_metadata.json`
        )
        const archiveRequest = this.FileListingService.getDetail({
                api: 'agave',
                scheme: 'public',
                system: archiveSystem,
                path: archivePath,
            }).then((resp) => {
                return resp.data;
            }).catch((e) => {
                return null;
            });
        const archiveMetaRequest = this.FileListingService.getDetail({
                api: 'agave',
                scheme: 'public',
                system: archiveSystem,
                path: archiveMetaPath,
            }).then((resp) => {
                return resp.data;
            }).catch((e) => {
                return null;
            });
        this.$q.all([
            archiveRequest,
            archiveMetaRequest
        ]).then(([archive, metadata]) => {
            this.archive = archive;
            this.metadata = metadata;
            if (!this.archive && !this.metadata) {
                this.error = true;
            }
            this.loaded = true;
        });
    }

    download() {
        this.retrievingPostit = true;
        const files = [this.archive]
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
