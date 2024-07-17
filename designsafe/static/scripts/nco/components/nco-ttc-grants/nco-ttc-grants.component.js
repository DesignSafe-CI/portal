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
            sort: 'End Date Descending',
        };
        // default intitial sorting
        this.selectedSort = 'End Date Descending';
        this._ui = {
            grantsLoading: true,
            facilitiesLoading: false,
            categoriesLoading: false,
            grantTypesLoading: false,
            hazardTypesLoading: false,
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

        this.loadGrantTypes({})
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.grantTypesError = err.message;
            }).finally( () => {
                this._ui.grantTypesLoading = false;
            });

        this.loadHazardTypes({})
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.hazardTypesError = err.message;
            }).finally( () => {
                this._ui.hazardTypesLoading = false;
            });

        this.sortOptions = [
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
            return this.categoriesList;
        }, (err) => {
            this._ui.categoriesError = err.message;
        }).finally ( () => {
            this._ui.categoriesLoading = false;
        });
    }

    loadGrantTypes(){
        this._ui.grantTypesLoading = true;
        return this.$http.get('/nco/api/ttc_grant_types')
        .then((resp) => {
            this.grantTypes = _.map(
                resp.data.response,
            );
            return this.grantTypes;
        }, (err) => {
            this._ui.grantTypesError = err.message;
        }).finally ( () => {
            this._ui.grantTypesLoading = false;
        });
    }

    loadHazardTypes(){
        this._ui.hazardTypesLoading = true;
        return this.$http.get('/nco/api/ttc_hazard_types')
        .then((resp) => {
            this.hazardTypes = _.map(
                resp.data.response,
            );
            return this.hazardTypes;
        }, (err) => {
            this._ui.hazardTypesError = err.message;
        }).finally ( () => {
            this._ui.hazardTypesLoading = false;
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
            hazard_type: this.selectedHazardType,
            grant_type: this.selectedGrantType,
            text_search: this.textSearch,
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
