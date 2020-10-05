import workspaceDataBrowserPublicationListingTemplate from './workspace-data-browser-publication-listing.template.html';
class WorkspaceDataBrowserPublicationListingCtrl {
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
            this.PublicationService.scrollPublications();
        }
    }

    chooseFile(publication) {
        this.$rootScope.$broadcast('provides-file', { requestKey: this.requestKey, path: `agave://designsafe.storage.published/${publication.projectId}` });
    }
}

export const WorkspaceDataBrowserPublicationListing = {
    controller: WorkspaceDataBrowserPublicationListingCtrl,
    template: workspaceDataBrowserPublicationListingTemplate,
    bindings: {
        listing: '<',
        selectable: '<',
        requestKey: '<',
        onSelect: '<',
        onBrowse: '&',
    }
};
