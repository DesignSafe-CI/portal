import NcoSchedulerListTemplate from './nco-scheduler-list.template.html';

class NcoSchedulerListCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit() {
    }
}

export const NcoSchedulerListComponent = {
    controller: NcoSchedulerListCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerListTemplate,
    bindings: {
        events: '=',
    },
};
