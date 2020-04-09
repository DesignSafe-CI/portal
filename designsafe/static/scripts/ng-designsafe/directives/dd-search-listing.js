/**
 *
 */
export function ddSearchListing() {
    'ngInject';
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: require('../html/directives/dd-search-listing.html'),
        scope: {
            browser: '=',
            onBrowse: '&',
            onSelect: '&',
            onDetail: '&'
        }
    };
}
