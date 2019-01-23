import _ from 'underscore';
import MyDataTemplate from './my-data.component.html';

class MyDataCtrl {
    constructor($state, Django, DataBrowserService) {
        'ngInject';
        this.browser = DataBrowserService.state();
        this.searchState = DataBrowserService.apiParams.searchState;
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
        this.Django = Django;
        this.$state = $state;
        this.resolveBreadcrumbHref.bind(this);
    }

    $onInit() {
        if (!this.browser.error) {
            this.browser.listing.href = this.$state.href('myData', {
                system: this.browser.listing.system,
                filePath: this.browser.listing.path,
            });
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href(
                    'myData',
                    { systemId: child.system, filePath: child.path }
                );
            });
        }

        this.data = {
            user: this.Django.user,
        };
    }

    resolveBreadcrumbHref(trailItem) {
        return this.$state.href(
            'myData',
            { systemId: this.browser.listing.system, filePath: trailItem.path }
        );
    }
}

export const MyDataComponent = {
    controller: MyDataCtrl,
    controllerAs: '$ctrl',
    template: MyDataTemplate,
};
