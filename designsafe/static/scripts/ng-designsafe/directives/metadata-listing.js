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
      template: require('../html/directives/metadata-listing.html'),
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