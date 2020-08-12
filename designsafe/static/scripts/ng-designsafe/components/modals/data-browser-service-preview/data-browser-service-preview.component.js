import DataBrowserServicePreviewTemplate from './data-browser-service-preview.component.html';
import _ from 'underscore';

class DataBrowserServicePreviewCtrl {
    constructor($sce, $http, $scope, $state, FileListingService, FileOperationService, ProjectService, nbv, Django) {
        'ngInject';
        this.$sce = $sce;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.ProjectService = ProjectService;
        this.nbv = nbv;
        this.Django = Django;
        this.$state = $state;
        this.$http = $http;
        this.$scope = $scope;
    }

    $onInit() {
        //TODO DES-1689: working metadata table and operation buttons
        this.textContent = '';
        this.videoHref = '';
        this.loading = true;
        this.error = false;

        this.tests = this.FileOperationService.getTests([this.resolve.file]);

        this.FileOperationService.getPreviewHref({
            file: this.resolve.file,
            api: this.resolve.api,
            scheme: this.resolve.scheme,
        }).then(
            (resp) => {
                this.fileType = resp.data.fileType;
                this.href = this.$sce.trustAs('resourceUrl', resp.data.href);
                if (this.fileType === 'other') {
                    // Unsupported file, hide spinner and display warning.
                    this.loading = false;
                }
                if (this.fileType === 'text') {
                    const oReq = new XMLHttpRequest();
                    oReq.open('GET', this.href);
                    oReq.responseType = 'blob';
                    oReq.onload = (e) =>
                        e.target.response.text().then((text) => {
                            this.textContent = text;
                            this.loading = false;
                            this.$scope.$apply();
                        });
                    oReq.send();
                }
                if (this.fileType === 'video') {
                    const oReq = new XMLHttpRequest();
                    oReq.open('GET', this.href);
                    oReq.responseType = 'blob';
                    oReq.onload = (e) => {
                        this.videoHref = URL.createObjectURL(e.target.response);
                        this.loading = false;
                        this.$scope.$apply();
                    };
                    oReq.send();
                }
            },
            (err) => {
                this.error = true;
                this.loading = false;
            }
        );
    }

    onLoad() {
        this.loading = false;
        this.$scope.$apply();
    }

    download() {
        const { api, scheme } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.download({ api, scheme, files });
    }

    copy() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.openCopyModal({ api, scheme, system, path, files });
    }
    move() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.openMoveModal({ api, scheme, system, path, files });
        this.close();
    }
    rename() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const file = this.resolve.file;
        this.FileOperationService.openRenameModal({ api, scheme, system, path, file });
        this.close();
    }

    close() {
        this.dismiss();
    }

    isJupyter() {
        if (this.resolve.api !== 'agave') {
            return false;
        } else {
            let fileExtension = this.resolve.file.name.split('.').pop();
            return fileExtension === 'ipynb';
        }
    }

    openInJupyter() {
        const filePath = this.resolve.file.path;
        let pathToFile = '';
        if (filePath.includes(this.Django.user)) {
            const lengthUserName = this.Django.user.length;
            pathToFile = filePath.substring(lengthUserName + 2);
        } else {
            pathToFile = filePath;
        }
        let specificLocation = this.$state.current.name;
        if (specificLocation === 'myData' || specificLocation === 'communityData') {
            specificLocation = specificLocation.charAt(0).toUpperCase() + specificLocation.slice(1);
        } else if (specificLocation.includes('projects')) {
            const prjNumber = this.ProjectService.current.value.projectId;
            specificLocation = 'projects/' + prjNumber;
        } else if (specificLocation === 'publishedData.view') {
            specificLocation = 'Published';
        }
        if (this.resolve.file.system === 'designsafe.storage.published') {
            specificLocation = 'NHERI-Published';
        }
        const fileLocation = specificLocation + '/' + pathToFile;
        const jupyterPath = `http://jupyter.designsafe-ci.org/user/${this.Django.user}/notebooks/${fileLocation}`;
        window.open(jupyterPath);
    }
}

export const DataBrowserServicePreviewComponent = {
    template: DataBrowserServicePreviewTemplate,
    controller: DataBrowserServicePreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
