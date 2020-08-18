import dataBrowserServiceListingModalTemplate from './data-browser-service-listing-modal.template.html';

class DataBrowserListingModalCtrl {
    constructor($scope, $state, $anchorScroll, $timeout, $location, Django, ProjectService, FileListingService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$anchorScroll = $anchorScroll;
        this.Django = Django;
        this.ProjectService = ProjectService;

        this.$timeout = $timeout;
        this.$location = $location;
        this.FileListingService = FileListingService;
    }

    $onInit() {
        this.entities = this.ProjectService.current.getAllRelatedObjects();
        this.bcParams = {
            skipRoot: false,
            customRoot: { path: '', label: 'Project' },
        };
        const { section, api, scheme, system, path } = this.resolve;
        this.FileListingService.browse({section, api, scheme, system, path}).then((_) =>
            this.FileListingService.setEntities(this.resolve.section, this.entities)
        );
    }

    breadcrumbParams() {
        return this.bcParams;
    }

    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();

        const section = this.resolve.section;
        const offset = 0;
        const { api, system, scheme } = this.FileListingService.listings.modal.params;

        this.FileListingService.browse({section, api, scheme, system, path: file.path, offset}).then((_) =>
            this.FileListingService.setEntities(this.resolve.section, this.entities)
        );
    }

    cancel() {
        this.dismiss();
    }
}

export const DataBrowserListingModal = {
    template: dataBrowserServiceListingModalTemplate,
    controller: DataBrowserListingModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
