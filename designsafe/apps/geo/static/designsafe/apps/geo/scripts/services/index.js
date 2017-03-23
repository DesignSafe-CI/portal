// import customOnChange from './custom-on-change';
import GeoStateService from './geo-state-service';
import GeoDataService from './geo-data-service';

let mod = angular.module('ds.geo.services', []);
mod.service('GeoStateService', GeoStateService);
mod.service('GeoDataService', GeoDataService);

// mod.directive('customOnChange', customOnChange);

export default mod;
