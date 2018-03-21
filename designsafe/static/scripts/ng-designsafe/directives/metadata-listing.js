/**
 *
 */
export const metadataListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('metadataListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/metadata-listing.html',
      scope: {
        columns: '=',
        listing: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

}