import NeesDoiListTemplate from './nees-doi-list.template.html';

class NeesDoiListCtrl {
    constructor () {
    }

    $onInit() {
        this.project = this.resolve.project;
        this.experimentDois = this.project.metadata.experiments.map((exp)=> {
            const authors = (exp.creators ? exp.creators.map((author) => `${author.lastName}, ${author.firstName}`).join('; ') : '')
            const year = exp.endDate.split('T')[0].split('-')[0];
            const doi = exp.doi;
            const doiUrl = `https://doi.org/${exp.doi}`;
            const title = exp.title;
            return {
                citationString:
             `${authors}, (${year}), "${title}", DesignSafe-CI [publisher], doi: ${doi}`,
                doiUrl
            };
        });
    }
    
    close() {
        return;
    }
}

export const NeesDoiListComponent = {
    template: NeesDoiListTemplate,
    controller: NeesDoiListCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
