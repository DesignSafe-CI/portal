import AuthorInformationModalTemplate from './author-information-modal.template.html';

class AuthorInformationModalCtrl {
    constructor() { }

    $onInit() { 
        this.author = this.resolve.author;
        this.first = this.author.fname;
        this.last = this.author.lname;
        this.email = this.author.email;
        this.institution = this.author.inst;
        this.username = this.author.name;
        if (this.author.orcid) {
            this.orcid = this.author.orcid;
        }
    }

    close() {
        return;
    }
}

export const AuthorInformationModalComponent = {
    template: AuthorInformationModalTemplate,
    controller: AuthorInformationModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
