/**
 *
 */
export const ddBoxListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddBoxListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-box-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

}