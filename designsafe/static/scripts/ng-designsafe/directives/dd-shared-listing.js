/**
 *
 */
export const ddSharedListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddSharedListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-shared-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        showFullPath: '&'
      }
    };
  });

}