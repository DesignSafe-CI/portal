/**
 *
 */
(function(window, angular) {

  var module = angular.module('ng.designsafe');

  module.directive('ddListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-listing.html',
      scope: {
        listing: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

})(window, angular);
