import NcoSchedulerTemplate from './nco-scheduler.template.html';
class NcoSchedulerCtrl {
    constructor() {
        'ngInject';
    }

    $onInit() {
        this.initialized = true;
    }
}

export const NcoSchedulerComponent = {
    controller: NcoSchedulerCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerTemplate,
    bindings: {
    },
};
