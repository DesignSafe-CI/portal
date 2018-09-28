/**
 *
 */
export function ddPublicListing() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-public-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        renderPath: '&',
        renderName: '&',
        scrollToBottom: '&',
        scrollToTop: '&',
        onMetadata: '&',
      }
    };
  }