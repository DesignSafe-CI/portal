/**
 *
 */
export function ddProjectSearchListing() {
      return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-project-search-listing.html',
        scope: {
          browser: '=',
          onBrowse: '&',
          onBrowseProject: '&',
          onSelect: '&',
          onDetail: '&',
          scrollToTop: '&',
          scrollToBottom: '&',
          openPreviewTree: '&',
          publicationCtrl: '=',
          projSearch: '='
        }
      };
    }