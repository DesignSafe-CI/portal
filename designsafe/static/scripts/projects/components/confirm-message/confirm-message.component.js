import ConfirmMessageTemplate from './confirm-message.template.html';
import _ from 'underscore';

class ConfirmMessageCtrl {

    constructor() {
        'ngInject';
    }

    $onInit() {
        this.message = this.resolve.message;
    }

    delete () {
        this.close({$value: true});
    }

    cancel() {
        this.close();
    }


}

export const ConfirmMessageComponent = {
    template: ConfirmMessageTemplate,
    controller: ConfirmMessageCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
