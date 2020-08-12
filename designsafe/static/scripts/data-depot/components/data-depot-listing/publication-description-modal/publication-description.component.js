import PublicationDescriptionModalTemplate from './publication-description.component.html'
class PublicationDescriptionModalCtrl {
    constructor(PublicationService) {
        'ngInject';
        this.PublicationService = PublicationService;
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
}
