import PublishedDataModalTemplate from './published-data-modal.template.html';

class PublishedDataModalCtrl {

    constructor($sce, $window) {
        'ngInject';
        this.$sce = $sce;
        this.$window = $window;
    }

    $onInit() {
        /*
        Accepts a list of data objects to render in a template.
        {'label': 'title', 'data': 'Title of Example'}
        */
        this.data = this.resolve.data;
    }

    cancel() {
        this.close();
    }
}

export const PublishedDataModalComponent = {
    template: PublishedDataModalTemplate,
    controller: PublishedDataModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
