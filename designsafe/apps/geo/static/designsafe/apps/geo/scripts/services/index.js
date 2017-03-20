// import customOnChange from './custom-on-change';
import GeoStateService from './geo-state-service';


let mod = angular.module('ds.geo.services', []);
mod.service('GeoStateService', GeoStateService);

// mod.directive('customOnChange', customOnChange);

export default mod;
