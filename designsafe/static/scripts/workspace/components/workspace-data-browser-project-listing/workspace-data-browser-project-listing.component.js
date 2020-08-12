import workspaceDataBrowserProjectListingTemplate from './workspace-data-browser-project-listing.template.html';
class WorkspaceDataBrowserProjectListingCtrl {
    constructor($rootScope, FileListingService, ProjectService, Django) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.FileListingService = FileListingService;
        this.ProjectService = ProjectService;
        this.Django = Django;
    }

    $onInit() {
    }

    scrollToBottom() {
        if (!this.listing.reachedEnd){
            this.ProjectService.scrollProjects({section: 'main'});
        }
    }

    chooseFile(project) {
        this.$rootScope.$broadcast('provides-file', { requestKey: this.requestKey, path: `agave://project-${project.uuid}` });
    }
}

export const WorkspaceDataBrowserProjectListing = {
    controller: WorkspaceDataBrowserProjectListingCtrl,
    template: workspaceDataBrowserProjectListingTemplate,
    bindings: {
        listing: '<',
        selectable: '<',
        requestKey: '<',
        onSelect: '<',
        onBrowse: '&',
        onScroll: '&'
    }
};
