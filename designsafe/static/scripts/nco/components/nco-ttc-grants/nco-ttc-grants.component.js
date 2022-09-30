import _ from 'underscore';
import NcoTtcGrantsTemplate from './nco-ttc-grants.template.html';

class NcoTtcGrantsCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit() {
        this._ui = { loading: true };

        this.loadGrants()
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.error = err.message;
            }).finally( () => {
                this._ui.loading = false;
                this.initialized = true;
            });
    }

    loadGrants(){
        this._ui.loading = true;
        return this.$http.get('/nco/api/ttc_grants')
            .then((resp) => {
                this.grantList = _.map(
                    resp.data.response,
                );
                return this.grantList;
            }, (err) => {
                this._ui.error = err.message;
            }).finally ( () => {
                this._ui.loading = false;
            });
    }
}

export const NcoTtcGrantsComponent = {
    controller: NcoTtcGrantsCtrl,
    controllerAs: '$ctrl',
    template: NcoTtcGrantsTemplate,
    bindings: {
    },
};
