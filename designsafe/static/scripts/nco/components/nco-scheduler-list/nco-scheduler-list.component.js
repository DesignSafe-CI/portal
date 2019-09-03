import NcoSchedulerListTemplate from './nco-scheduler-list.template.html';

class NcoSchedulerListCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit() {
        this._ui = { loading: true };
        this.$http.get('/nco/api/projects')
            .then((resp) => {
                this.projects = resp.data.response;
            }, (err) => {
                this._ui.error = err.message;
            }).finally( () => {
                this._ui.loading = false;
            });
    }
}

export const NcoSchedulerListComponent = {
    controller: NcoSchedulerListCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerListTemplate,
    bindings: {
    },
};
