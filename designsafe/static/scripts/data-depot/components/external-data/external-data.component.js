import BoxTemplate from './external-data-box.component.html';
import GoogledriveTemplate from './external-data-googledrive.component.html';
import DropboxTemplate from './external-data-dropbox.component.html';

import _ from 'underscore';
class ExternalDataCtrl {
    constructor($state, Django, DataBrowserService) {
        'ngInject';
        this.browser = DataBrowserService.state();
        this.$state = $state;
        this.Django = Django;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        if (this.browser.error){
            return;
        }
        this.browser.listing.href = this.$state.href(
            this.$state.current.name, {
                filePath: this.$scope.browser.listing.id
            }
        );
        _.each(this.browser.listing.children, (child) => {
            child.href = this.$state.href(this.$state.current.name, { filePath: child.id });
        });

        this.data = {
            customRoot: {
                name:  this.$state.current.params.name,
                href: this.$state.href(
                    this.$state.current.name,
                    { filePath: this.$state.current.params.customRootFilePath }
                )
            }
        };
    }
}

export const GoogledriveComponent = {
    controller: ExternalDataCtrl,
    controllerAs: '$ctrl',
    template: GoogledriveTemplate
};

export const DropboxComponent = {
    controller: ExternalDataCtrl,
    controllerAs: '$ctrl',
    template: DropboxTemplate
};

export const BoxComponent = {
    controller: ExternalDataCtrl,
    controllerAs: '$ctrl',
    template: BoxTemplate
};
