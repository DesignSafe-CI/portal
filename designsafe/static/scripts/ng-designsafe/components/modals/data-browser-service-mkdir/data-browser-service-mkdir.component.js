import dataBrowserServiceMkdirTemplate from './data-browser-service-mkdir.template.html';
class DataBrowserServiceMkdirCtrl {
    constructor($state, FileOperationService) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.$state = $state;

        this.successCallback = this.successCallback.bind(this)
    }

    $onInit() {
        this.folderName = ''
    }

    successCallback() {
        this.$state.reload();
    }

    mkdir() {
        const { api, scheme, system, path } = this.resolve;
        this.dismiss();
        this.FileOperationService.handleMkdir({api, scheme, system, path, successCallback: this.successCallback, folderName: this.folderName})
    }


    cancel() {
        this.dismiss();
    }
}


export const DataBrowserServiceMkdir = {
    controller: DataBrowserServiceMkdirCtrl,
    template: dataBrowserServiceMkdirTemplate,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
}
