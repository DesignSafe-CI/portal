import PublicationDescriptionModalTemplate from './publication-description.component.html'
class PublicationDescriptionModalCtrl {
    constructor() {
    }
    $onInit() {
        console.log(this.resolve)
    }
}

const publicationDescriptionModalComponent = {
    template: PublicationDescriptionModalTemplate,
    controller: PublicationDescriptionModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}

export default publicationDescriptionModalComponent