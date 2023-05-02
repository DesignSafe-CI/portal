import _ from 'underscore';
import NcoTtcGrantsTemplate from './nco-ttc-grants.template.html';

class NcoTtcGrantsCtrl {
    constructor($http, $uibModal) {
        'ngInject';
        this.$http = $http;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this._ui = {
            grantsLoading: true,
            facilitiesLoading: false,
        };

        this.loadGrants()
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.grantsError = err.message;
            }).finally( () => {
                this._ui.grantsLoading = false;
                this.initialized = true;
            });

        this.loadFacilities({})
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.facilitiesError = err.message;
            }).finally( () => {
                this._ui.facilitiesLoading = false;
            });

        this.sortOptions = [
            "Start Date Descending",
            "Start Date Ascending",
            "End Date Descending",
            "End Date Ascending",
        ];
    }

    loadGrants(params){
        this._ui.grantsLoading = true;
        return this.$http.get('/nco/api/ttc_grants', { params: params })
            .then((resp) => {
                this.grantList = _.map(
                    resp.data.response,
                );
                return this.grantList;
            }, (err) => {
                this._ui.grantsError = err.message;
            }).finally ( () => {
                this._ui.grantsLoading = false;
            });
    }

    loadFacilities(){
        this._ui.facilitiesLoading = true;
        return this.$http.get('/nco/api/ttc_facilities')
            .then((resp) => {
                this.facilitiesList = _.map(
                    resp.data.response,
                );
                return this.facilitiesList;
            }, (err) => {
                this._ui.facilitiesError = err.message;
            }).finally ( () => {
                this._ui.facilitiesLoading = false;
            });
    }

    showAbstract(abstract) {
        this.$uibModal.open({
            component: 'ncoTtcAbstract',
            resolve: {
                abstract: () => abstract
            },
            size: 'lg',
        });
    }

    filterSearch(){
        var params = {
            facility: this.selectedFacility,
            sort: this.selectedSort,
        };
        this.loadGrants(params);
    }
}

export const NcoTtcGrantsComponent = {
    controller: NcoTtcGrantsCtrl,
    controllerAs: '$ctrl',
    template: NcoTtcGrantsTemplate,
    bindings: {
    },
};
