import TtcAbstractModalTemplate from './ttc-abstract-modal.template.html';

class TtcAbstractModalCtrl {
    constructor () {
    }

    $onInit() {
        this.abstract = this.resolve.abstract;
    }

    close() {
        return;
    }
}

export const TtcAbstractModalComponent = {
    template: TtcAbstractModalTemplate,
    controller: TtcAbstractModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
