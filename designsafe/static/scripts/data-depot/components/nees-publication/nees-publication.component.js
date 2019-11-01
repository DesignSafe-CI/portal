class NeesPublicationCtrl {
    constructor($stateParams, $state, PublishedService, DataBrowserService, $uibModal) {
        'ngInject';
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.PublishedService = PublishedService;
        this.DataBrowserService = DataBrowserService;
        this.$uibModal = $uibModal;
        this.onBrowse = this.onBrowse.bind(this);
        this.onDetail = this.onDetail.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.scrollToTop = this.scrollToTop.bind(this);
        this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this);
    }

    $onInit() {
        this.DataBrowserService.apiParams.fileMgr = 'published';
        this.DataBrowserService.apiParams.baseUrl = '/api/public/files';
        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href('publicData', { systemId: 'nees.public', filePath: '' }),
                system: 'nees.public',
                path: '/',
            },
        };

        //Retrieve NEES project name using path
        this.projectName = this.$stateParams.filePath.replace(/^\/+/, '').split('.')[0];
        this.PublishedService.getNeesPublished(this.projectName).then((res) => {
            this.project = res.data;
        });
        this.browser = this.DataBrowserService.state();
        this.DataBrowserService.browse({ system: 'nees.public', path: this.$stateParams.filePath });
    }
    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();

        if (file.path === '/') {
            this.$state.go('publicData');
            return;
        }
        if (typeof file.type !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else {
            this.$state.go('neesPublished', { filePath: file.path }, { reload: true });
        }
    }
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
        } else if (typeof file._ui !== 'undefined' && file._ui.selected) {
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }
    }
    scrollToTop() {
        return;
    }
    scrollToBottom() {
        this.DataBrowserService.scrollToBottom();
    }
    onDetail($event, file) {
        $event.stopPropagation();
        this.DataBrowserService.preview(file, this.browser.listing);
    }
    resolveBreadcrumbHref(trailItem) {
        return this.$state.href('neesPublished', { filePath: trailItem.path.replace(/^\/+/, '') });
    }
    showExp (exp) {
        this.$uibModal.open({
            component: 'neesCitationModal',
            resolve: {
                experiment: () => exp
            }
        });
    }   
}

export const NeesPublishedComponent = {
    controller: NeesPublicationCtrl,
    template: require('./nees-publication.template.html'),
};
