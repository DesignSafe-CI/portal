import publishedTemplate from './published.html';

export class PublishedParentCtrl {
    constructor($stateParams, PublicationService, $q){
        'ngInject';
        this.$stateParams = $stateParams;
        this.PublicationService = PublicationService;
        this.$q = $q;
    }

    $onInit() {
        this.ui = { loading: true };
        let projId = this.$stateParams.filePath.replace(/^\/+/, '').split('/')[0];
        
        if (projId) {
            this.PublicationService.getPublished(projId)
            .then((resp) => {
                this.publication = resp.data;
                this.PublicationService.updateHeaderMetadata(this.publication, projId)
                this.type = this.publication.project.value.projectType;
                this.version = this.publication.version || 1;
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
