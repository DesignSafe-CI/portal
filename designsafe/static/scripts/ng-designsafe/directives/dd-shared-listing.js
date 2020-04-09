/**
 *
 */
export function ddSharedListing() {
    'ngInject';
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: require('../html/directives/dd-shared-listing.html'),
        scope: {
            browser: '=',
            onBrowse: '&',
            onSelect: '&',
            onDetail: '&',
            showFullPath: '&'
        }
    };
}
