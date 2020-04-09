import PublicationDescriptionModalTemplate from './publication-description.component.html';
class PublicationDescriptionModalCtrl {
    constructor() {
    }
}

export const PublicationDescriptionModalComponent = {
    template: PublicationDescriptionModalTemplate,
    controller: PublicationDescriptionModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
