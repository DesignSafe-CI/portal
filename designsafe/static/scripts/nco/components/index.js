import { NcoSchedulerComponent } from './nco-scheduler/nco-scheduler.component';
import { NcoSchedulerFiltersComponent } from './nco-scheduler-filters/nco-scheduler-filters.component.js';
import { NcoSchedulerListComponent } from './nco-scheduler-list/nco-scheduler-list.component.js';

let ncoComponents = angular.module('nco.components', []);

ncoComponents.component('ncoScheduler', NcoSchedulerComponent);
ncoComponents.component('ncoSchedulerFilters', NcoSchedulerFiltersComponent);
ncoComponents.component('ncoSchedulerList', NcoSchedulerListComponent);

export default ncoComponents;
