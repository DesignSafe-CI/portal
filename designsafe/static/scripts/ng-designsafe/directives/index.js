import angular from 'angular';

let designsafeDirectives = angular.module('designsafe.directives', []);

import { ddAltmetrics } from './dd-altmetrics';
// import { myDataBrowser } from './my-data-browser';
import { fileModel, spinnerOnLoad, httpSrc, accessfiles,
         selectOnFocus, dsDataDraggable, dsDraggable, dsInfiniteScroll,
         dsUser, dsUserList, dsAuthorList, dsFixTop, yamzTerm, iframeOnload,
        } from './ng-designsafe-directives';
import { prjMetadata, prjPubPreviewMetadata, relatedWork, referencedData, prjPubCollections } from './project-directives';
import { ShowMoreComponent } from '../../_common/show-more.component';

let ddComponents = angular.module('dd.components', ['dd.components.projects']);
ddComponents.component('showMore', ShowMoreComponent);

designsafeDirectives.directive('ddAltmetrics', ['$sce', '$filter', ddAltmetrics]);
// designsafeDirectives.directive('myDataBrowser', myDataBrowser);

designsafeDirectives.directive('fileModel', fileModel);
designsafeDirectives.directive('spinnerOnLoad', spinnerOnLoad);
designsafeDirectives.directive('httpSrc', httpSrc);
designsafeDirectives.directive('accessfiles', accessfiles);
designsafeDirectives.directive('selectOnFocus', selectOnFocus);
designsafeDirectives.directive('dsDataDraggable', dsDataDraggable);
designsafeDirectives.directive('dsDraggable', dsDraggable);
designsafeDirectives.directive('dsInfiniteScroll', dsInfiniteScroll);
designsafeDirectives.directive('dsUser', dsUser);
designsafeDirectives.directive('dsUserList', dsUserList);
designsafeDirectives.directive('dsAuthorList', dsAuthorList);
designsafeDirectives.directive('dsFixTop', dsFixTop);
designsafeDirectives.directive('yamzTerm', yamzTerm);
designsafeDirectives.directive('iframeOnload', iframeOnload);

designsafeDirectives.directive('prjMetadata', prjMetadata);
designsafeDirectives.directive('prjPubPreviewMetadata', prjPubPreviewMetadata);
designsafeDirectives.directive('relatedWork', relatedWork);
designsafeDirectives.directive('referencedData', referencedData);
designsafeDirectives.directive('prjPubCollections', prjPubCollections);

export default designsafeDirectives;
