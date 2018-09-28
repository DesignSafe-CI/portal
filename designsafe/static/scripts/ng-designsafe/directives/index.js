import angular from 'angular';

let designsafeDirectives = angular.module('designsafe.directives', []);

import { ddAltmetrics } from './dd-altmetrics';
import { ddBoxListing } from './dd-box-listing';
import { ddBreadcrumb } from './dd-breadcrumb';
import { ddDropboxListing } from './dd-dropbox-listing';
import { ddListing } from './dd-listing';
import { ddGoogleDriveListing } from './dd-googledrive-listing';
import { ddProjectSearchListing } from './dd-project-search-listing';
import { ddPublicListing } from './dd-public-listing';
import { ddPublicSearchListing } from './dd-public-search-listing';
import { ddSearchListing } from './dd-search-listing';
import { ddSharedListing } from './dd-shared-listing';
import { metadataListing } from './metadata-listing';
import { myDataBrowser } from './my-data-browser';
import { fileModel, spinnerOnLoad, httpSrc, accessfiles, 
         selectOnFocus, dsDataDraggable, dsDraggable, dsInfiniteScroll, 
         dsUser, dsFixTop, yamzTerm, } from './ng-designsafe-directives';

designsafeDirectives.directive('ddAltmetrics', ddAltmetrics);
designsafeDirectives.directive('ddBoxListing', ddBoxListing);
designsafeDirectives.directive('ddBreadcrumb', ddBreadcrumb);
designsafeDirectives.directive('ddDropboxListing', ddDropboxListing);
designsafeDirectives.directive('ddListing', ddListing);
designsafeDirectives.directive('ddGoogleDriveListing', ddGoogleDriveListing);
designsafeDirectives.directive('ddProjectSearchListing', ddProjectSearchListing);
designsafeDirectives.directive('ddPublicListing', ddPublicListing);
designsafeDirectives.directive('ddPublicSearchListing', ddPublicSearchListing);
designsafeDirectives.directive('ddSearchListing', ddSearchListing);
designsafeDirectives.directive('ddSharedListing', ddSharedListing);
designsafeDirectives.directive('metadataListing', metadataListing);
designsafeDirectives.directive('myDataBrowser', myDataBrowser);

designsafeDirectives.directive('fileModel', fileModel);
designsafeDirectives.directive('spinnerOnLoad', spinnerOnLoad);
designsafeDirectives.directive('httpSrc', httpSrc);
designsafeDirectives.directive('accessfiles', accessfiles);
designsafeDirectives.directive('selectOnFocus', selectOnFocus);
designsafeDirectives.directive('dsDataDraggable', dsDataDraggable);
designsafeDirectives.directive('dsDraggable', dsDraggable);
designsafeDirectives.directive('dsInfiniteScroll', dsInfiniteScroll);
designsafeDirectives.directive('dsUser', dsUser);
designsafeDirectives.directive('dsFixTop', dsFixTop);
designsafeDirectives.directive('yamzTerm', yamzTerm);

export default designsafeDirectives;