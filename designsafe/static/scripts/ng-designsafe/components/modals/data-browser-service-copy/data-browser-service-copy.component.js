import dataBrowserServiceCopyTemplate from './data-browser-service-copy.template.html';

class DataBrowserCopyCtrl {
    constructor($scope, $state, $anchorScroll, $timeout, $location, Django, FileListingService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$anchorScroll = $anchorScroll;
        this.Django = Django;

        this.$timeout = $timeout;
        this.$location = $location;
        this.FileListingService = FileListingService;
    }

    $onInit() {
        this.options = [{ api: 'googledrive', label: 'Google Drive' }, { api: 'agave', label: 'Agave' }];

        this.selectedOption = this.FileListingService.listings.main.params.api;
        const section = 'modal';
        const offset = 0;
        const { api, system, path, limit } = this.FileListingService.listings.main.params;
        this.FileListingService.browse(section, api, system, path, offset, limit);
    }

    scrollToBottom() {
        const section = 'modal';
        const { api, system, path } = this.FileListingService.listings.modal.params;
        this.FileListingService.browseScroll(section, api, system, path);
    }

    onBrowse($event, path) {
        $event.preventDefault();
        $event.stopPropagation();

        const section = 'modal';
        const offset = 0;
        const { api, system } = this.FileListingService.listings.modal.params;

        this.FileListingService.browse(section, api, system, path, offset);
    }

    handleCopy(file) {
        this.FileListingService.handleCopy(file, this.close);
    }

    handleChange() {
        const initialParams = {
            googledrive: { api: 'googledrive', system: 'googledrive', path: 'root' },
            agave: { api: 'agave', system: 'designsafe.storage.default', path: this.Django.user },
        };
        console.log(this.selectedOption);
        const { api, system, path } = initialParams[this.selectedOption];
        const section = 'modal';
        const offset = 0;
        this.FileListingService.browse(section, api, system, path, offset);
    }

    cancel() {
        this.dismiss();
    }
}

export const DataBrowserCopyModal = {
    template: dataBrowserServiceCopyTemplate,
    controller: DataBrowserCopyCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
