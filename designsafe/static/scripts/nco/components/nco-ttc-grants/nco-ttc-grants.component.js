import _ from 'underscore';
import NcoTtcGrantsTemplate from './nco-ttc-grants.template.html';

class NcoTtcGrantsCtrl {
    constructor($http, $uibModal) {
        'ngInject';
        this.$http = $http;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.initialParams = {
            sort: 'Start Date Descending',
        };
        // default intitial sorting
        this.selectedSort = 'Start Date Descending';
        this._ui = {
            grantsLoading: true,
            facilitiesLoading: false,
            categoriesLoading: false,
        };

        this.loadGrants(this.initialParams)
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

        this.loadCategories({})
        .then((resp) => {
            return resp;
        }, (err) => {
            this._ui.categoriesError = err.message;
        }).finally( () => {
            this._ui.categoriesLoading = false;
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

    loadCategories(){
        this._ui.categoriesLoading = true;
        return this.$http.get('/nco/api/ttc_categories')
        .then((resp) => {
            this.categoriesList = _.map(
                resp.data.response,
            );
            console.log(this.categoriesList);
            return this.categoriesList;
        }, (err) => {
            this._ui.categoriesError = err.message;
        }).finally ( () => {
            this._ui.categoriesLoading = false;
        });
    }

    //view details
    showAbstract(grant) {
        this.$uibModal.open({
            component: 'ncoTtcAbstract',
            resolve: {
                grant: () => grant
            },
            size: 'lg',
        });
    }

    filterSearch(){
        var params = {
            facility: this.selectedFacility,
            category: this.selectedCategory,
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
