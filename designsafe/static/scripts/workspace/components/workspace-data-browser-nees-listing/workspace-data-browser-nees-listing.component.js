import workspaceDataBrowserNeesListingTemplate from './workspace-data-browser-nees-listing.template.html';
class WorkspaceDataBrowserNeesListingCtrl {
    constructor($rootScope, FileListingService, ProjectService, PublicationService, Django) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.FileListingService = FileListingService;
        this.ProjectService = ProjectService;
        this.PublicationService = PublicationService;
        this.Django = Django;
    }

    $onInit() {
    }

    scrollToBottom() {
        if (!this.listing.reachedEnd){
            this.PublicationService.scrollPublicationsLegacy();
        }
    }

    chooseFile(publication) {
        this.$rootScope.$broadcast('provides-file', { requestKey: this.requestKey, path: `agave://${publication.project}` });
    }
}

export const WorkspaceDataBrowserNeesListing = {
    controller: WorkspaceDataBrowserNeesListingCtrl,
    template: workspaceDataBrowserNeesListingTemplate,
    bindings: {
        listing: '<',
        selectable: '<',
        requestKey: '<',
        onSelect: '<',
        onBrowse: '&',
    }
};
