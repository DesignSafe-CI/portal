import angular from 'angular';
import { uuid } from 'uuidv4';
import dataBrowserServiceUploadTemplate from './data-browser-service-upload.template.html';
import { tickStep } from 'd3';
class DataBrowserServiceUploadCtrl {
    constructor($scope, $q, $state, Modernizr, FileOperationService) {
        this.$q = $q;
        this.Modernizr = Modernizr;
        this.FileOperationService = FileOperationService
        this.$scope = $scope;
        this.$state = $state;

        this.uploadCallback = this.uploadCallback.bind(this)
    }
    $onInit() {
        this.directoryUploadSupported = this.Modernizr.fileinputdirectory;
        this.File
 
        this.selectedFiles = [];
        this.uploads = [];

        this.$scope.$watch('$ctrl.selectedFiles', (inputFiles) => {
            [...inputFiles].forEach((file) => {
                file.key = uuid();
                this.uploads.push(file);
                this.FileOperationService.operations.upload.status[file.key] = 'pending'
            });
            
            // reset file control since we want to allow multiple selection events
            angular.element('#id-choose-files').val(null);
        });
    }

    upload() {
        this.FileOperationService.handleUpload({
            api: this.resolve.api,
            scheme: this.resolve.scheme,
            system: this.resolve.system,
            path: this.resolve.path,
            files: this.uploads,
            callback: this.uploadCallback
        });
    }

    retry() {
        $scope.data.uploads = _.where($scope.data.uploads, { state: 'error' });
        $scope.upload();
        $scope.state.retry = false;
    }

    /**
     * Remove an upload from the list of staged uploads.
     *
     * @param index
     */
    removeUpload(index) {
        this.uploads.splice(index, 1);
    }

    /**
     * Clear all staged uploads.
     */
    reset() {
        // reset models
        this.selectedFiles = [];
        this.uploads = [];
    }

    uploadInProgress() {
        const states = Object.values(this.FileOperationService.operations.upload.status);
        return states.includes('uploading')
    }

    hasFailedUploads() {
        const states = Object.values(this.FileOperationService.operations.upload.status);
        return states.includes('error')
    }

    uploadCallback() {
        if (this.hasFailedUploads()) {
            return
        }
        this.dismiss();
        this.$state.reload();
    }

    /**
     * Cancel and close upload dialog.
     */
    cancel() {
        this.close();
    }
}

export const DataBrowserServiceUpload = {
    controller: DataBrowserServiceUploadCtrl,
    template: dataBrowserServiceUploadTemplate,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
