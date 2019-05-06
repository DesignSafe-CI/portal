import PublicationCitationTemplate from './publication-citation.component.html';

class PublicationCitationCtrl {
    constructor($sce, $window) {
        'ngInject';
        this.$sce = $sce;
        this.$window = $window;
    }

    $onInit() {
        this.entity = this.resolve.entity;
        this.publication = this.resolve.publication;
        let authors = '';
        this.entity.authors.forEach(
            (a) => {
                if (a && a.lname && a.fname && a.authorship) {
                    authors += a.lname + ', ' + a.fname + ', ';
                }
            }
        );
        let citationDate = this.publication.created.split('T')[0];
        this.citation = this.$sce.trustAsHtml(
            authors  +
            '(' + citationDate + ')' +
            '" ' + this.entity.value.title + ' ", ' +
            'Designsafe-CI [publisher], Dataset, ' +
            this.entity.doi
        );
        this.citationUrl = 'https://doi.org/' + this.entity.doi.slice(4);
        this.doiCitation = this.entity.doi.slice(4);
    }

    downloadCitation() {
        let url = "https://data.datacite.org/application/vnd.datacite.datacite+xml/" + this.doiCitation;
        this.$window.open(url);
    }
}

export const PublishedCitationComponent = {
    template: PublicationCitationTemplate,
    controllerAs: '$ctrl',
    controller: PublicationCitationCtrl,
    bindings: {
        resolve: '<',
    }
};
