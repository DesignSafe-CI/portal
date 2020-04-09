/**
 *
 */
export function ddDropboxListing() {
    'ngInject';
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: require('../html/directives/dd-dropbox-listing.html'),
        scope: {
            browser: '=',
            onBrowse: '&',
            onSelect: '&',
            onDetail: '&'
        }
    };
}
