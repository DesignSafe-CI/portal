import DataBrowserServicePreviewTemplate from './data-browser-service-preview.component.html';
import _ from 'underscore';

class DataBrowserServicePreviewCtrl {

    constructor($sce, DataBrowserService, nbv, Django) {
        'ngInject';
        this.$sce = $sce
        this.DataBrowserService = DataBrowserService
        this.nbv = nbv;
        this.Django = Django;
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
                    //let nbv = this.nbv; // Quickfix
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
                                    this.nbv.render(content, target);
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

    notInJupyterTree() {
        let designsafePath = this.file.href;
        if (
            designsafePath.includes('dropbox') ||
            designsafePath.includes('googledrive') ||
            designsafePath.includes('box') ||
            designsafePath.includes('shared')
        ) {
            return true;
        }
        return false;
    };

    isJupyter() {
        let designsafePath = this.file.href;
        if (this.notInJupyterTree()) {
            return false;
        } else {
        let fileExtension = this.file.name.split('.').pop();
            return fileExtension == 'ipynb';
        }
    };

    openInJupyter() {
        const filePath = this.file.path;
        let pathToFile = '';
        if (filePath.includes(this.Django.user)) {
            const lenghtUserName = this.Django.user.length;
            pathToFile = filePath.substring(lenghtUserName + 2);
        } else {
            pathToFile = filePath;
        }
        let specificLocation = this.DataBrowserService.state().listing.name;
        if (specificLocation === 'myData' || specificLocation === 'communityData') {
            specificLocation = (specificLocation.charAt(0).toUpperCase() + specificLocation.slice(1));
        } else if (specificLocation.includes('projects')) {
            const prjNumber = this.DataBrowserService.state().project.value.projectId;
            specificLocation = 'projects/' + prjNumber;
        } else if (specificLocation === 'publishedData') {
            specificLocation = 'Published';
        }
        const fileLocation = specificLocation + "/" + pathToFile;
        const jupyterPath = `http://jupyter.designsafe-ci.org/user/${this.Django.user}/notebooks/${fileLocation}`;
        window.open(jupyterPath);
    };
}

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
