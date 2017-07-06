import RapidDataService from './rapid-data-service';
import RapidAdminService from './rapid-admin-service';

let mod = angular.module('ds.rapid.services', []);

mod.service('RapidDataService', RapidDataService);
mod.service('RapidAdminService', RapidAdminService);
