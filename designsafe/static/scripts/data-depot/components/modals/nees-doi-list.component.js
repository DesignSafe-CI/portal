import NeesDoiListTemplate from './nees-doi-list.template.html';

class NeesDoiListCtrl {
    constructor () {
    }

    $onInit() {
        this.project = this.resolve.project;
        this.experimentDois = this.project.metadata.experiments.map((exp) => ({
            title: exp.title,
            DOI: exp.doi,
            doiURL: `https://doi.org/${exp.doi}`
        }));
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