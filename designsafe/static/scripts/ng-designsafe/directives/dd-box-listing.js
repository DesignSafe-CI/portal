/**
 *
 */
export function ddBoxListing() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-box-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  }