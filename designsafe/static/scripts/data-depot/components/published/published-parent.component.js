import publishedTemplate from './published.html';

export class PublishedParentCtrl {
    constructor($stateParams, DataBrowserService, PublicationService, FileListing){
        'ngInject';
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.PublicationService = PublicationService;
        this.FileListing = FileListing;
    }

    $onInit() {
        //this.version = this.resolve.version;
        this.ui = {};
        this.browser = {}
        var projId = this.$stateParams.filePath.replace(/^\/+/, '').split('/')[0];
        this.ui.loading = true;
        this.project = null;

        if (projId) {
            this.PublicationService.getPublished(projId)
                .then((resp) => {
                    this.PublicationService.updateHeaderMetadata(projId, resp)
                    this.version = resp.data.version || 1;
                    this.type = resp.data.project.value.projectType;
                    this.publication = resp.data
                    this.ui.loading = false;
                });
        }
    }

    viewToShow() {
        if (this.ui.loading) {
            return null
        }
        if (this.version === 1) {
            return 'v1';
        }
        return this.type.toLowerCase();
    }

    showV1View() {
        return this.version === 1 && !this.ui.loading;
    }

    showExpView() {
        return (this.version === 2 &&
               this.type.toLowerCase() === 'experimental' &&
               !this.ui.loading);
    }
    showSimView() {
        return (this.version === 2 &&
               this.type.toLowerCase() === 'simulation' &&
               !this.ui.loading);
    }
    showHybSimView() {
        return (this.version === 2 &&
               this.type.toLowerCase() === 'hybrid_simulation' &&
               !this.ui.loading);
    }
    showFieldReconView() {
        return (this.version === 2 &&
               this.type.toLowerCase() === 'field_recon' &&
               !this.ui.loading);
    }
    showOtherView() {
        return (this.version === 2 &&
               this.type.toLowerCase() === 'other' &&
               !this.ui.loading);
    }
}

export const PublishedParentComponent = {
    controller: PublishedParentCtrl,
    controllerAs: '$ctrl',
    template: publishedTemplate,
    bindings: {
        version: '<',
        type: '<',
    }
};
