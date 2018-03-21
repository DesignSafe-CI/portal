/**
 *
 */
export const ddPublicSearchListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddPublicSearchListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-public-search-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        renderPath: '&',
        renderName: '&'
      }
    };
  });

}