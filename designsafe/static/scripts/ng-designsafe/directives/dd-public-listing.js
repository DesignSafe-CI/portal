/**
 *
 */
(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddPublicListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-public-listing.html',
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

})(window, angular);
