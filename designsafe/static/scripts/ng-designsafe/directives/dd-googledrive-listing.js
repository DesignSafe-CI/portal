/**
 *
 */
(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddGoogleDriveListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-googledrive-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

})(window, angular);
