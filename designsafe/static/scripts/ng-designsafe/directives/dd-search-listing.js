/**
 *
 */
export const ddSearchListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddSearchListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-search-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

}