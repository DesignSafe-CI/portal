import PublicationDownloadModalTemplate from './publication-download.template.html';

class PublicationDownloadModalCtrl {

    constructor(FileListing, $http) {
        'ngInject';
        this.FileListing = FileListing;
        this.$http = $http;
    }

    $onInit() {
        this.loaded = null;
        this.error = null;
        this.retrievingPostit = null;
        this.publication = this.resolve.publication;
        this.mediaUrl = this.resolve.mediaUrl;
        this.prjId = this.publication.project.value.projectId;
        
        let archive = {};
        archive.type = 'file';
        archive.path = `/archives/${this.prjId}_archive.zip`;
        archive.name = `${this.prjId}_archive.zip`;
        archive.system = 'designsafe.storage.published'

        this.archiveListing = this.FileListing.init(archive, {fileMgr: 'published', baseUrl: '/api/public/files'});
        this.archiveListing.fetch().then((resp) => {
            this.arcData = resp;
        }).finally(() => {
            if (!this.arcData) {
                this.error = true;
            }
            this.loaded = true;
        });
    }

    download() {
        this.retrievingPostit = true;
        this.archiveListing.download().then(function (resp) {
            let postit = resp.href;
            let link = document.createElement('a');
            link.style.display = 'none';
            link.setAttribute('href', postit);
            link.setAttribute('download', "null");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).finally(() => {
            this.retrievingPostit = false;
            this.cancel();
        });
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
