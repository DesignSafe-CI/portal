import angular from 'angular'

import { dsFileUrl, dsFileDisplayName, dsListingDisplayName, 
         dsTrailDisplayName, dsSharedFilePath} from './data-browser-filters';

import { bytes, keys, length, toTrusted } from './ng-designsafe-filters';

let designsafeFilters = angular.module('designsafe.filters', [])

designsafeFilters.filter('dsFileUrl', dsFileUrl);
designsafeFilters.filter('dsFileDisplayName', dsFileDisplayName);
designsafeFilters.filter('dsListingDisplayName', dsListingDisplayName);
designsafeFilters.filter('dsTrailDisplayName', dsTrailDisplayName);
designsafeFilters.filter('dsSharedFilePath', dsSharedFilePath);
designsafeFilters.filter('bytes', bytes);
designsafeFilters.filter('keys', keys);
designsafeFilters.filter('length', length);
designsafeFilters.filter('toTrusted', toTrusted);

export default designsafeFilters