import DataBrowserServicePreviewTemplate from './data-browser-service-preview.component.html';

class DataBrowserServicePreviewCtrl {

    constructor($sce, DataBrowserService) {
        console.log('in preview.')
        this.$sce = $sce
        this.DataBrowserService = DataBrowserService
    }

    $onInit() {
        this.file = this.resolve.file
        this.listing = this.resolve.listing

        const file = this.file
        const listing = this.listing

        this.tests = this.DataBrowserService.allowedActions([file]);

        if (typeof listing !== 'undefined' &&
            typeof listing.metadata !== 'undefined' &&
            !_.isEmpty(listing.metadata.project)) {
            var _listing = angular.copy(listing);
            this.file.metadata = _listing.metadata;
        }
        this.busy = true;

        file.preview().then(
            (data) => {
                this.previewHref = this.$sce.trustAs('resourceUrl', data.href);
                console.log(this.previewHref.toString())
                this.busy = false;
            },
            (err) => {
                var fileExt = file.name.split('.').pop();
                var videoExt = ['webm', 'ogg', 'mp4'];

                //check if preview is video
                if (videoExt.includes(fileExt)) {
                    this.prevVideo = true;
                    file.download().then(
                        (data) => {
                            var postit = data.href;
                            var oReq = new XMLHttpRequest();
                            oReq.open("GET", postit, true);
                            oReq.responseType = 'blob';

                            oReq.onload = () => {
                                if (this.status === 200) {
                                    var videoBlob = this.response;
                                    var vid = URL.createObjectURL(videoBlob);

                                    // set video source and mimetype
                                    document.getElementById("videoPlayer").src = vid;
                                    document.getElementById("videoPlayer").setAttribute('type', `video/${fileExt}`);
                                };
                            };
                            oReq.onerror = () => {
                                this.previewError = err.data;
                                this.busy = false;
                            };
                            oReq.send();
                            this.busy = false;
                        },
                        (err) => {
                            this.previewError = err.data;
                            this.busy = false;
                        });
                    // if filetype is not video or ipynb
                } else if (fileExt != 'ipynb') {
                    this.previewError = err.data;
                    this.busy = false;
                    // if filetype is ipynb
                } else {
                    file.download().then(
                        (data) => {
                            var postit = data.href;
                            var oReq = new XMLHttpRequest();

                            oReq.open("GET", postit, true);

                            oReq.onload = (oEvent) => {
                                var blob = new Blob([oReq.response], { type: "application/json" });
                                var reader = new FileReader();

                                reader.onload = (e) => {
                                    var content = JSON.parse(e.target.result);
                                    var target = $('.nbv-preview')[0];
                                    nbv.render(content, target);
                                };

                                reader.readAsText(blob);
                            };

                            oReq.send();
                        },
                        (err) => {
                            this.previewError = err.data;
                            this.busy = false;
                        });
                }
            }
        );
    }

    download() {
        this.DataBrowserService.download(this.file);
    };

    share() {
        this.DataBrowserService.share(this.file);
    };

    copy() {
        this.DataBrowserService.copy(this.file);
    };

    move() {
        this.DataBrowserService.move(this.file, this.DataBrowserService.state().listing);
    };

    rename() {
        this.DataBrowserService.rename(this.file);
    };

    viewMetadata() {
        this.close();
        this.DataBrowserService.viewMetadata([this.file]);
    };

    trash() {
        this.DataBrowserService.trash(this.file);
    };

    rm() {
        this.DataBrowserService.rm(this.file);
    };

    close() {
        this.dismiss();
    };
}

DataBrowserServicePreviewCtrl.$inject = ['$sce', 'DataBrowserService']

export const DataBrowserServicePreviewComponent = {
    template: DataBrowserServicePreviewTemplate,
    controller: DataBrowserServicePreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}