/**
 *
 */
(function(window, angular) {

  var module = angular.module('ng.designsafe');

  module.directive('ddSearchListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-search-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&'
      }
    };
  });

})(window, angular);
