import angular from 'angular';

import { PublishedService } from './published.service';

let ddServices = angular.module('dd.services', []);

ddServices.service('PublishedService', PublishedService);

export default ddServices;