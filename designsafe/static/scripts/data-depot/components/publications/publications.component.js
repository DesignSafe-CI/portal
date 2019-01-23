import _ from 'underscore';
import publicationsTemplate from './publications.component.html';

class PublicationDataCtrl {
    constructor($state, Django, DataBrowserService) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.$state = $state;
        this.Django = Django;
        this.browser = DataBrowserService.state();
    }

    $onInit() {
        this.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0,
        };

        if (this.browser.error) {
            return;
        }
        this.browser.listing.href = this.$state.href(
            'publicData',
            {
                system: this.browser.listing.system,
                filePath: this.browser.listing.path,
            }
        );
        _.each(this.browser.listing.children, (child) => {
            if (child.system === 'nees.public') {
                child.href = this.$state.href(
                    'publicData',
                    { system: child.system, filePath: child.path }
                );
            }
            if (child.system === 'designsafe.storage.published') {
                child.href = this.$state.href(
                    'publishedData',
                    { system: child.system, filePath: child.path }
                );
            }
        });

        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href(
                    'publicData',
                    { systemId: 'nees.public', filePath: '' }
                ),
                system: 'nees.public',
                path: '/',
            },
        };
    }

    renderName(file) {
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null || _.isEmpty(file.metadata)) {
            if (file.meta && file.meta.title) {
                return file.meta.title;
            }
            return file.name;
        }
        var pathComps = file.path.split('/');
        var experiment_re = /^experiment/;
        if (file.path[0] === '/' && pathComps.length === 2) {
            return file.metadata.project.title;
        } else if (file.path[0] !== '/' && pathComps.length === 2 && experiment_re.test(file.name.toLowerCase())) {
            return file.metadata.experiments[0].title;
        }
        return file.name;
    }
}

export const PublicationsComponent = {
    controller: PublicationDataCtrl,
    controllerAs: '$ctrl',
    template: publicationsTemplate,
};
