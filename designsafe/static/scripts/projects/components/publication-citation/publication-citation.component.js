import PublicationCitationTemplate from './publication-citation.component.html';

class PublicationCitationCtrl {
    constructor($sce, $window) {
        'ngInject';
        this.$sce = $sce;
        this.$window = $window;
    }

    $onInit() {
        this.entity = this.resolve.entity;
        this.version = this.resolve.version || 2;
        this.publication = this.resolve.publication;
        this.auths = [];
        this.doi = '';

        if (this.entity && this.version !== 1) {
            this.auths = angular.copy(this.entity.authors);
            this.doi = this.entity.doi;
        } else if (this.version === 1) {
            /* TODO: This needs some cleaning up.
            Things to consider when refactoring:
            1) First and Second generation publications
            2) Do we need the publication object, or can we
               simplify the parameters for this modal?
            3) Different publishable entities
            4) Version information
            5) Missing or undefined fields
            */
            this.doi = this.entity.doi
            var publishers = this.publication.users.filter((usr) => {
                // early publications automatically set the pi and copi users as authors
                if (
                    this.entity.name === 'designsafe.project' ||
                    this.entity.name === 'designsafe.project.analysis' ||
                    this.entity[0]
                ) {
                    return ('coPis' in this.publication.project.value
                        ? this.publication.project.value.coPis
                            .concat(this.publication.project.value.pi)
                            .includes(usr.username)
                        : this.publication.project.value.pi === usr.username
                    )
                } else {
                    return this.entity.value.authors.includes(usr.username);
                }
            });


            if (
                typeof this.entity.value.projectType !== 'undefined' &&
                this.entity.value.projectType === 'other'
            ) {
                publishers = this.publication.users;
            }


            publishers = publishers.sort ((p) => {
                if (typeof p._ui[this.entity.uuid] !== 'undefined') {
                    return p._ui[this.entity.uuid];
                } else {
                    return p._ui.order;
                }
            });
            this.auths = publishers.map((p) => ({
                order: p._ui.order,
                fname: p.first_name,
                lname: p.last_name,
                authorship: true
            }));
        } else if (this.publication.project.value.projectType !== 'other') {
            // exp,hyb,sim,field 
            let authIds = [];
            if (this.publication.project.value.coPis) {
                authIds = this.publication.project.value.coPis.concat(this.publication.project.value.pi);
            } else {
                authIds = [this.publication.project.value.pi];
            }
            this.auths = this.publication.authors.filter((author) => authIds.includes(author.name));
        } else {
            // other
            this.auths = angular.copy(this.publication.project.value.teamOrder);
        }

        if (!this.entity && !this.publication.project.doi && this.publication.project.value.dois.length){
            this.doi = this.publication.project.value.dois[0];
        } else if (!this.entity && this.publication.project.doi) {
            this.doi = this.publication.project.doi;
        }

        this.authors = '';
        this.auths.sort((a, b) => {
            return a.order - b.order;
        });
        this.auths.forEach(
            (a) => {
                if (a && a.lname && a.fname && a.authorship) {
                    this.authors += a.lname + ', ' + a.fname + ', ';
                }
            }
        );
        this.citationDate = this.publication.created.split('T')[0].split('-')[0];
        this.citationUrl = 'https://doi.org/' + this.doi.replace(/doi:/, '');
        this.doiCitation = this.doi.replace(/doi:/, '');
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
