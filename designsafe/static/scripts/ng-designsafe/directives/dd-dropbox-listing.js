/**
 *
 */
export const ddDropboxListing = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddDropboxListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-dropbox-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

}