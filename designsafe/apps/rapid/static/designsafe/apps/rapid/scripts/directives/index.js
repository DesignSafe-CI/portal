import eventListing from './event-listing';
import eventListingDetailed from './event-listing-detailed';

let mod = angular.module('ds.rapid.directives', []);

mod.directive('eventListing', eventListing);
mod.directive('eventListingDetailed', eventListingDetailed);
