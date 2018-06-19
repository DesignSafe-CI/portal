/**
 *
 */
export const ddGoogleDriveListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddGoogleDriveListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-googledrive-listing.html'),
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

}