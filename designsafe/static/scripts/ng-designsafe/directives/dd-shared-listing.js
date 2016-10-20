/**
 *
 */
(function(window, angular) {

  var module = angular.module('ng.designsafe');

  module.directive('ddSharedListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-shared-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        showFullPath: '&'
      }
    };
  });

})(window, angular);
