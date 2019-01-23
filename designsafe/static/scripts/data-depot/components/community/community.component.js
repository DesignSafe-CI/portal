import _ from 'underscore';
import CommunityTemplate from './community.component.html';

class CommunityDataCtrl {
    constructor($scope, $state, Django, DataBrowserService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.Django = Django;
        this.DataBrowserService = DataBrowserService;

        this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this);
        this.scrollToTop = this.scrollToTop.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.onBrowse = this.onBrowse.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onDetail = this.onDetail.bind(this);
        this.showFullPath = this.showFullPath.bind(this);
        this.renderName = this.renderName.bind(this);
    }

    $onInit() {
        this.browser = this.DataBrowserService.state();
        this.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0,
        };

        if (!this.browser.error) {
            this.browser.listing.href = this.$state.href('communityData', {
                system: this.browser.listing.system,
                filePath: this.browser.listing.path,
            });
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href('communityData', { system: child.system, filePath: child.path });
            });
        }

        this.data = {
            customRoot: {
                name: 'Community Data',
                href: this.$state.href('communityData', {
                    systemId: this.browser.listing.system,
                    filePath: '/',
                }),
            },
        };
    }

    showFullPath(item) {
        if (
            this.browser.listing.path != '$PUBLIC' &&
            item.parentPath() != this.browser.listing.path &&
            item.parentPath() != '/'
        ) {
            return true;
        }
        return false;
    }
}

export const CommunityComponent = {
    controller: CommunityDataCtrl,
    controllerAs: '$ctrl',
    template: CommunityTemplate,
};
