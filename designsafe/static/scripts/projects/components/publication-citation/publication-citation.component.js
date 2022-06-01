import PublicationCitationTemplate from './publication-citation.template.html';

class PublicationCitationCtrl {
    constructor($sce, $window) {
        'ngInject';
        this.$sce = $sce;
        this.$window = $window;
    }

    $onInit() {
        this.publication = this.resolve.publication;
        this.entity = this.resolve.entity;
        this.created = this.resolve.created;
        this.projectGen = this.publication.version || 1;
        this.citationDate = new Date(this.publication.created).getFullYear();
        if (this.projectGen === 1) {
            // early publications - other & experimental
            this.doi = this.publication.project.doi.split(":").pop();
            this.authors = [];

            let authorObj = JSON.parse(JSON.stringify(this.publication.users));
            authorObj.sort((a, b) => { return a._ui.order - b._ui.order });
            authorObj.forEach((author) => {
                this.authors.push(author.last_name + ', ' + author.first_name);
            });
        } else {
            // second generation publications
            if (this.entity) {
                this.doi = this.entity.doi || this.entity.value.dois[0];
                this.authors = this.entity.authors
                this.citationDate = new Date(this.created).getFullYear();
            } else {
                this.doi = this.publication.project.value.dois[0];
                this.authors = this.publication.project.value.teamOrder;
            }
        }
        this.citationUrl = 'https://doi.org/' + this.doi;
    }

    downloadCitation() {
        let url = "https://data.datacite.org/application/vnd.datacite.datacite+xml/" + this.doi;
        this.$window.open(url);
    }
}

export const PublishedCitationComponent = {
    template: PublicationCitationTemplate,
    controllerAs: '$ctrl',
    controller: PublicationCitationCtrl,
    bindings: {
        resolve: '<',
        close: '&'
    }
};
