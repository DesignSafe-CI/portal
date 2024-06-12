import PublishedDataModalTemplate from './published-data-modal.template.html';

class PublishedDataModalCtrl {

    constructor($sce, $window) {
        'ngInject';
        this.$sce = $sce;
        this.$window = $window;
    }

    $onInit() {
        /*
        Display Version Details for Publications
        */
        this.publication = this.resolve.publication;
        
        let date = new Date(this.publication.revisionDate);
        let type = this.publication.project.value.projectType;

        this.entName = null
        if (type === 'experimental') this.entName = 'Experiment';
        if (type === 'simulation') this.entName = 'Simulation';
        if (type === 'hybrid_simulation') this.entName = 'Hybrid Simulation';
        if (type === 'field_recon') this.entName = 'Mission';

        this.versionDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
        this.version = this.publication.revision;
        this.versionedTitles = this.publication.revisionTitles;
        this.versionDescription = this.publication.revisionText;
    }

    cancel() {
        this.close();
    }
}

export const PublishedDataModalComponent = {
    template: PublishedDataModalTemplate,
    controller: PublishedDataModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
