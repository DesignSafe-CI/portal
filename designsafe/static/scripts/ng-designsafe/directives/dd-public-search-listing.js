/**
 *
 */
export function ddPublicSearchListing() {
    'ngInject';
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-public-search-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        renderPath: '&',
        renderName: '&'
      }
    };
  }
