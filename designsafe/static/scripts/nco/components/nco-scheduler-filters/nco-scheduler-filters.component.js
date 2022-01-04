import NcoSchedulerFiltersTemplate from './nco-scheduler-filters.template.html';
class NcoSchedulerFiltersCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit(){
        this._ui = {};
        this.$http.get('/nco/api/filters')
            .then((resp) => {
                this.filterValues = resp.data.response;
            }, (err) => {
                this._ui.error = err.message;
            });
        this._ui.sortBy = [
            'Start Date - newest first',
            'Start Date - oldest first',
            'Award Number',
            'Facility',
            'PI Name'
        ];
        this._ui.timeFilters = [
            'Event Started Last 7 Days',
            'Event Started Last 14 Days',
            'Event Started Last 30 Days',
            'Event Started Last 90 Days',
            'Event Will Start in 7 Days',
            'Event Will Start in 14 Days',
            'Event Will Start in 30 Days',
            'Event Will Start in 90 Days',
            'Happening This Week',
            'Happening This Month',
        ];
        this.sortby = 'Start Date - oldest first';
        this.historyEnabled = false;
    }

    applyFilterAndSort(){
        this.filters = [];
        this.sort = [];
        for (let filterName in this.filterSel){
            if (this.filterSel[filterName]) {
                this.filters.push({
                    name: filterName, value: this.filterSel[filterName]
                });
            }
        }
        if (! this.historyEnabled) {
            this.filters.push({ name: "time", value: "No History" });
        }
        if (this.sortby){
            this.sort.push(this.sortby);
        }
        this.filterAndSort({ filters: this.filters, sort:this.sort });
    }

    toggleHistory() {
        this.historyEnabled = !this.historyEnabled;
        this.applyFilterAndSort();
    }
}

export const NcoSchedulerFiltersComponent = {
    controller: NcoSchedulerFiltersCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerFiltersTemplate,
    bindings: {
        filterAndSort: '&',
    },
};
