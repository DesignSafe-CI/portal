/**
 *
 */
export function metadataListing() {
    'ngInject';
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: require('../html/directives/metadata-listing.html'),
        scope: {
            columns: '=',
            listing: '=',
            onBrowse: '&',
            onSelect: '&',
            onDetail: '&'
        }
    };
}
