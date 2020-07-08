import _ from 'underscore';
import { uuid } from 'uuidv4';
import DataDepotBrowserTemplate from './data-depot-browser.component.html';
import DataDepotPublicationTemplate from './data-depot-browser.publications.component.html';

class DataDepotBrowserCtrl {
    constructor($state, $stateParams, Django, DataBrowserService) {
        'ngInject';
        this.browser = DataBrowserService.state();
        this.searchState = DataBrowserService.apiParams.searchState;
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
        this.Django = Django;
        this.$state = $state;
        this.$stateParams = $stateParams;
    }

    $onInit() {
        this.DataBrowserService.apiParams.fileMgr = this.apiParams.fileMgr;
        this.DataBrowserService.apiParams.baseUrl = this.apiParams.baseUrl;
        this.DataBrowserService.apiParams.searchState = this.apiParams.searchState;
        const setupListing = () => {
            this.browser.listing.href = this.$state.href(
                this.$state.current.name,
                {
                    system: this.browser.listing.system,
                    filePath: this.browser.listing.path.replace(/^\/+/, ''),
                }
            );
            _.each(this.browser.listing.children, (child) => {
                let stateName = this.$state.current.name;
                if (child.system === 'nees.public') {
                    stateName = 'neesPublished';
                } else if (child.system === 'designsafe.storage.published'){
                    stateName = 'publishedData.view';
                }
                child.href = this.$state.href(
                    stateName,
                    { systemId: child.system, filePath: child.path.replace(/^\/+/, '') },
                    {inherit: false}
                );
            });
            this.data = {
                user: this.Django.user,
            };
        };

        this.DataBrowserService.browse({
            system: this.$stateParams.systemId,
            path: this.path}, {
            query_string: this.$stateParams.query_string,
            typeFilters: this.$stateParams.typeFilters,
            offset: this.$stateParams.offset,
            limit: this.$stateParams.limit,
        }).then(setupListing);
    }
}

class DataDepotBrowserCtrl2 {
    constructor($state, $stateParams, FileListingService, $http, $scope) {
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.FileListingService = FileListingService;
        this.$http = $http;
        this.$scope = $scope

        this.scrollToBottom = this.scrollToBottom.bind(this);
    }

    $onInit() {
        const section = 'main';
        const api = this.apiParams.fileMgr;
        const system = this.$stateParams.systemId || 'googledrive';
        const path = this.$stateParams.filePath

        this.offset = 0;
        this.limit = 15;

        this.FileListingService.browse(section, api, system, path, this.offset, this.limit);
    }

    scrollToBottom() {
        const section = 'main';
        const api = this.apiParams.fileMgr;
        const system = this.$stateParams.systemId;
        const path = this.$stateParams.filePath

        this.FileListingService.browseScroll(section, api, system, path)
    }

    onBrowse($event, path) {
        $event.preventDefault();
        $event.stopPropagation();
        const section = 'main';
        const api = this.apiParams.fileMgr;
        const system = this.$stateParams.systemId;

        this.$state.go(this.$state.current.name, {filePath: path.replace('/', '')}, {inherit: false})
    }
}

export const DataDepotBrowserComponent = {
    controller: DataDepotBrowserCtrl2,
    controllerAs: '$ctrl',
    template: DataDepotBrowserTemplate,
    bindings: {
        apiParams: '<',
        path: '<',
    },
};

export const DataDepotPublicationsBrowserComponent = {
    controller: DataDepotBrowserCtrl,
    controllerAs: '$ctrl',
    template: DataDepotPublicationTemplate,
    bindings: {
        apiParams: '<',
        path: '<',
    },
};
