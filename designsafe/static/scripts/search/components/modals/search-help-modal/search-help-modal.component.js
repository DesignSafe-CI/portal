import SearchHelpModalTemplate from './search-help-modal.component.html';
class SearchHelpModalCtrl {
    constructor() {
    }
}

export const SearchHelpModalComponent = {
    template: SearchHelpModalTemplate,
    controller: SearchHelpModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};