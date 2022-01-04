import _ from 'underscore';
import NcoSchedulerTemplate from './nco-scheduler.template.html';
class NcoSchedulerCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit() {
        this._ui = { loading: true };
        this.filters = [];
        this.sorts = [];

        this.filters.push( { name: "time", value: "No History" } );
        this.sorts.push( "Start Date - oldest first" );

        this.loadProjects({ filters: this.filters, sorts: this.sorts })
            .then((resp) => {
                return resp;
            }, (err) => {
                this._ui.error = err.message;
            }).finally( () => {
                this._ui.loading = false;
                this.initialized = true;
            });
    }

    /*
     * Loads projects from DB.
     * @param {Object} params Extra parameters for listing.
     * @param {int} params.pageNumber 0-based page number.
     * @param {Object[]} params.filters Array in the form
     *  {"name": "filter name", "value": "filter value"}
     * @param {Object[]} params.sorts Array in the form
     *  {"name": "key name", "value": 1}
     */
    loadProjects(params){
        this._ui.loading = true;
        return this.$http.get('/nco/api/projects', { params: params })
            .then((resp) => {
                this.events = _.map(
                    resp.data.response,
                    (evt) => {
                        if (evt.dateEnd && evt.dateEnd.$date) {
                            let dateEnd = new Date(evt.dateEnd.$date);
                            delete evt.dateEnd;
                            evt.dateEnd = dateEnd;
                        }
                        if (evt.dateStart && evt.dateStart.$date) {
                            let dateStart = new Date(evt.dateStart.$date);
                            delete evt.dateStart;
                            evt.dateStart = dateStart;
                        }
                        return evt;
                    });
                this._ui.total = parseInt(resp.data.total);
                this._ui.pageNumber = parseInt(resp.data.pageNumber);
                this._ui.pageSize = parseInt(resp.data.pageSize);
                return this.events;
            }, (err) => {
                this._ui.error = err.message;
            }).finally( () => {
                this._ui.loading = false;
            });
    }

    /*
     * Loads next page of projects.
     */
    nextPage(){
        let page = this._ui.pageNumber + 1;
        return this.loadProjects({
            pageNumber: page,
            filters: this.filters,
            sorts: this.sorts,
        });
    }

    /*
     * Loads prev page of projects.
     */
    prevPage(){
        let page = this._ui.pageNumber - 1;
        return this.loadProjects({
            pageNumber: page,
            filters: this.filters,
            sorts: this.sorts,
        });
    }

    /*
     * Filters and/or sorts projects.
     *
     * param {Object[]} filters Array of filters.
     * param {Object[]} sort Array of sort.
     */
    filterAndSort(filters, sort){
        let params = {
            filters: filters,
            sorts: sort,
        };
        this.filters = filters;
        this.sorts = sort;
        this.loadProjects(params);
    }
}

export const NcoSchedulerComponent = {
    controller: NcoSchedulerCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerTemplate,
    bindings: {
    },
};
