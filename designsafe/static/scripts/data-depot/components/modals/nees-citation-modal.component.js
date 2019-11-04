import NeesCitationModalTemplate from './nees-citation-modal.template.html';

class NeesCitationModalCtrl {
    constructor () {
    }

    $onInit() {
        this.experiment = this.resolve.experiment;
        
        this.authors = this.experiment.creators.map((author) => `${author.lastName}, ${author.firstName}`).join('; ');
        this.year = this.experiment.endDate.split('T')[0].split('-')[0];
        this.doi = this.experiment.doi;
        this.doiUrl = `https://doi.org/${this.experiment.doi}`;
        this.title = this.experiment.title;
        this.citationString = 
            `${this.authors}, (${this.year}), "${this.title}", DesignSafe-CI [publisher], doi: ${this.doi}`;
    }
    
    close() {
        return;
    }
}

export const NeesCitationModalComponent = {
    template: NeesCitationModalTemplate,
    controller: NeesCitationModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
