import _ from 'underscore';
import publicationsTemplate from './publications.component.html';

class PublicationDataCtrl {
    constructor($scope, $state, $stateParams, $uibModal, Django, DataBrowserService) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.$state = $state;
        this.Django = Django;
        this.DataBrowserService = DataBrowserService;
        this.$uibModal = $uibModal;

        this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this);
        this.onBrowse = this.onBrowse.bind(this);
        this.scrollToTop = this.scrollToTop.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.renderName = this.renderName.bind(this);
        this.showDescription = this.showDescription.bind(this);
        this.typeFilter = this.typeFilter.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.areFiltersEmpty = this.areFiltersEmpty.bind(this);
        this.browser = {}
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
                    { system: child.system, filePath: child.path.replace(/^\/+/, '') }
                );
            }
            if (child.system === 'designsafe.storage.published') {
                child.href = this.$state.href(
                    'publishedData.view',
                    { system: child.system, filePath: child.path.replace(/^\/+/, '') }
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
    };
    showDescription(title, description) {
      var modal = this.$uibModal.open({
        component: 'publicationDescriptionModalComponent',
        resolve: {
          title: () => title,
          description: () => description,
        },
        size: 'lg'
      })
    }
    areFiltersEmpty() {
        let noneToggled = true
        for (const key of Object.keys(this.toggles)) {
            if (this.toggles[key]) {
                noneToggled = false
            }
        }
        if (noneToggled) {
            return true
        }
        return false
    }
    typeFilter(item, x, y) {
        if (this.areFiltersEmpty()) {
            return true
        }
        if (item.metadata && this.toggles['nees']) {
            return true
        }
        return this.toggles[(item.meta || {}).type]; 
    }
    clearFilters() {
        for (const key of Object.keys(this.toggles)) {
            this.toggles[key] = false
        }
        
    }
}

export const PublicationsComponent = {
    controller: PublicationDataCtrl,
    controllerAs: '$ctrl',
    template: publicationsTemplate,
};
