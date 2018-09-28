/**
 *
 */
export function ddListing() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        scrollToTop: '&',
        scrollToBottom: '&',
        openPreviewTree: '&',
        publicationCtrl: '='
      }
    };
  }