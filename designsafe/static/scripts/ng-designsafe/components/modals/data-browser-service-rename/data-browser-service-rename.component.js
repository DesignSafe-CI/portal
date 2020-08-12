import dataBrowserServiceRenameTemplate from './data-browser-service-rename.template.html';

class DataBrowserServiceRenameCtrl {
    constructor($state, FileOperationService) {
        'ngInject';
        this.$state = $state;
        this.FileOperationService = FileOperationService;
        this.successCallback = this.successCallback.bind(this);
    }

    $onInit() {
        this.newName = this.resolve.file.name
        this.hasEntities = this.FileOperationService.checkForEntities(this.resolve.file)
    }

    rename() {
        const { api, scheme } = this.resolve;
        const { system, path } = this.resolve.file;
        const newName = this.newName;
        this.dismiss();
        this.FileOperationService.handleRename({api, scheme, system, path, newName, successCallback: this.successCallback})

    }

    successCallback() {
        this.$state.reload();
    }

    cancel() {
        this.dismiss();
    }
}

export const DataBrowserServiceRename = {
    controller: DataBrowserServiceRenameCtrl,
    template: dataBrowserServiceRenameTemplate,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
}