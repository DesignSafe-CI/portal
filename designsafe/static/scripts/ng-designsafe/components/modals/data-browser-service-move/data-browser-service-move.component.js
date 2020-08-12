import dataBrowserServiceMoveTemplate from './data-browser-service-move.component.html';

class DataBrowserMoveCtrl {
    constructor(
        $scope,
        $state,
        $anchorScroll,
        $timeout,
        $location,
        Django,
        FileListingService,
        FileOperationService,
        ProjectService
    ) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$anchorScroll = $anchorScroll;
        this.Django = Django;

        this.$timeout = $timeout;
        this.$location = $location;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.ProjectService = ProjectService;

        this.successCallback = this.successCallback.bind(this);
    }

    $onInit() {
        const section = 'modal';
        const offset = 0;

        this.hasEntities = this.resolve.files.map(this.FileOperationService.checkForEntities).find(x => x)

        if (this.$state.current.name === 'myData') {
            this.breadcrumbParams = this.FileListingService.fileMgrMappings.agave.breadcrumbParams;
        } else {
            const projectId = this.ProjectService.current.value.projectId;
            this.breadcrumbParams = {
                skipRoot: false,
                customRoot: { label: projectId, path: '' },
            };
        }

        const { api, scheme, system, path } = this.resolve;
        this.FileListingService.browse({ section, api, scheme, system, path, offset });
    }

    onBrowse(file) {
        const section = 'modal';
        const offset = 0;
        const { api, system, scheme } = this.FileListingService.listings.modal.params;

        this.FileListingService.browse({ section, api, scheme, system, path: file.path, offset });
    }

    successCallback() {
        this.$state.reload();
    }

    handleMove(dest) {
        this.close();

        this.FileOperationService.handleMove({
            srcApi: this.resolve.api,
            srcFiles: this.resolve.files,
            destApi: this.FileListingService.listings.modal.params.api,
            destSystem: dest.system,
            destPath: dest.path,
            successCallback: this.successCallback,
        });
    }

    handleFooterMove() {
        this.handleMove({
            system: this.FileListingService.listings.modal.params.system,
            path: this.FileListingService.listings.modal.params.path,
        });
    }

    getModalListing() {
        const srcSystem = this.resolve.files[0].system;
        const srcPaths = this.resolve.files.map((f) => f.path);
        this.FileListingService.listings.modal.listing = this.FileListingService.listings.modal.listing.filter(
            (f) => !(f.system === srcSystem && srcPaths.includes(f.path))
        );
        return this.FileListingService.listings.modal
    }

    cancel() {
        this.dismiss();
    }
}

export const DataBrowserServiceMoveComponent = {
    template: dataBrowserServiceMoveTemplate,
    controller: DataBrowserMoveCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
