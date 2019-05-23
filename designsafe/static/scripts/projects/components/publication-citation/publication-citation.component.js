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
        this.auths = [];
        this.doi = '';

        if (!this.entity) {
            this.auths = angular.copy(this.publication.project.value.teamOrder);
            this.doi = this.publication.project.doi;
        } else {
            this.auths = angular.copy(this.entity.authors);
            this.doi = this.entity.doi;
        }

        let authors = '';
        this.auths.sort((a, b) => {
            return a.order - b.order;
        });
        this.auths.forEach(
            (a) => {
                if (a && a.lname && a.fname && a.authorship) {
                    authors += a.lname + ', ' + a.fname + ', ';
                }
            }
        );
        this.citationDate = this.publication.created.split('T')[0];
        this.citationUrl = 'https://doi.org/' + this.doi.slice(4);
        this.doiCitation = this.doi.slice(4);
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
        close: '&'
    }
};
