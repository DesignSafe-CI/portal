import { NcoSchedulerComponent } from './nco-scheduler/nco-scheduler.component';
import { NcoSchedulerFiltersComponent } from './nco-scheduler-filters/nco-scheduler-filters.component.js';
import { NcoSchedulerListComponent } from './nco-scheduler-list/nco-scheduler-list.component.js';
import { NcoSchedulerPaginationComponent } from './nco-scheduler-pagination/nco-scheduler-pagination.components.js';
import { NcoTtcGrantsComponent } from './nco-ttc-grants/nco-ttc-grants.component.js';

let ncoComponents = angular.module('nco.components', []);

//scheduler components
ncoComponents.component('ncoScheduler', NcoSchedulerComponent);
ncoComponents.component('ncoSchedulerFilters', NcoSchedulerFiltersComponent);
ncoComponents.component('ncoSchedulerList', NcoSchedulerListComponent);
ncoComponents.component('ncoSchedulerPagination', NcoSchedulerPaginationComponent);

//ttc_grants components
ncoComponents.component('ncoTtcGrants', NcoTtcGrantsComponent);

export default ncoComponents;
