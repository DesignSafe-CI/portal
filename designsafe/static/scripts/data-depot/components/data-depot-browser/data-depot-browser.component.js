import _ from 'underscore';
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
                    stateName = 'publishedData';
                }
                child.href = this.$state.href(
                    stateName,
                    { systemId: child.system, filePath: child.path.replace(/^\/+/, '') }
                );
            });
            this.data = {
                user: this.Django.user,
            };
        };

        if (!this.$stateParams.query_string){
            this.DataBrowserService.browse({
                system: this.$stateParams.systemId,
                path: this.path,
            }).then(setupListing);
        } else {
            this.DataBrowserService.search({
                system: this.$stateParams.systemId,
                query_string: this.$stateParams.query_string,
                offset: this.$stateParams.offset,
                limit: this.$stateParams.limit,
                shared: this.$stateParams.shared || false,
            }).then(setupListing);
        }
    }
}

export const DataDepotBrowserComponent = {
    controller: DataDepotBrowserCtrl,
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
