import _ from 'underscore';
import publicationsTemplate from './publications.component.html';

class PublicationDataCtrl {
    constructor($scope, $state, $stateParams, $uibModal, Django, DataBrowserService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$stateParams = $stateParams;
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
        this.swapToggle = this.swapToggle.bind(this);
        this.typeFilter = this.typeFilter.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.areFiltersEmpty = this.areFiltersEmpty.bind(this);
    }
    $onInit() {
        this.browser = this.DataBrowserService.state();
        this.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0
        };
        this.toggles = {
            experimental: false,
            simulation: false,
            hybrid: false,
            nees: false,
            other: false
        }
        var systemId = this.$stateParams.systemId || 'nees.public';
        var filePath = this.$stateParams.filePath || '/';
        
        this.DataBrowserService.browse({system: systemId, path: filePath}, {queryString: this.$stateParams.query_string})
            .then(resp => {
                if (!this.browser.error) {
                    this.browser.listing.href = this.$state.href('publicData', {
                        system: this.browser.listing.system,
                        filePath: this.browser.listing.path
                    });
                    this.browser.listing.children.forEach((child) => {
                        if (child.system === 'nees.public') {
                            child.href = this.$state.href('neesPublishedData', { filePath: child.path }).replace('%2F', '/');
                        }
                        if (child.system === 'designsafe.storage.published') {
                            child.href = this.$state.href('publishedData', { system: child.system, filePath: child.path }).replace('%2F', '/');
                        }
                    });
                }
            })
        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href('publicData', { systemId: 'nees.public', filePath: '' }),
                system: 'nees.public',
                path: '/'
            }
        };
    }
    resolveBreadcrumbHref(trailItem) {
        return this.$state.href('publicData', { systemId: this.browser.listing.system, filePath: trailItem.path });
    };
    scrollToTop() {
        return;
    };
    scrollToBottom() {
        this.DataBrowserService.scrollToBottom();
    };
    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        if (file.system === 'nees.public') {
            if (file.path === '/') {
                this.$state.go('publicData', {query_string: null}, {reload: true, inherit: false});
            }
            else {
                this.$state.go('neesPublishedData', { filePath: file.path });
            }
        } else {
            this.$state.go('publishedData', { systemId: file.system, filePath: file.path });
        }
    };
    onSelect($event, file) {
        $event.preventDefault();
        $event.stopPropagation();

        if ($event.ctrlKey || $event.metaKey) {
            var selectedIndex = this.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && this.browser.selected.length > 0) {
            var lastFile = this.browser.selected[this.browser.selected.length - 1];
            var lastIndex = this.browser.listing.children.indexOf(lastFile);
            var fileIndex = this.browser.listing.children.indexOf(file);
            var min = Math.min(lastIndex, fileIndex);
            var max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(this.browser.listing.children.slice(min, max + 1));
        } else if (typeof file._ui !== 'undefined' &&
            file._ui.selected) {
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }
    };
    renderName(file) {
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null ||
            Object.keys(file.metadata).length === 0) {
            if (file.meta && file.meta.title) {
                return file.meta.title;
            } else {
                return file.name;
            }
        }
        else {
            return file.metadata.project.title;
        }
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
    template: publicationsTemplate
}