/**
 *
 */
export const ddPublicListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddPublicListing', function() {
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
  });

}