import BreadcrumbTemplate from './breadcrumb.template.html';

class BreadcrumbCtrl {
    constructor($state, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this._ui = { loading: false, error: false };
        this.offset = 0;
        if (this.skipRoot || this.customRoot) {
            this.offset = 1;
        }
    }

    breadcrumbHref(item) {
        return this.$state.href(
            this.$state.current.name,
            { systemId: this.browser.listing.system, filePath: item.path }
        );
    }
}

export const BreadcrumbComponent = {
    controller: BreadcrumbCtrl,
    controllerAs: '$ctrl',
    template: BreadcrumbTemplate,
    bindings: {
        browser: '=',
        customRoot: '=',
        skipRoot: '<',
    },
};
