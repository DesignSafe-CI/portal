/**
 *
 */
(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddListing', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-listing.html',
      scope: {
        browser: '=',
        onBrowse: '&',
        onSelect: '&',
        onDetail: '&',
        scrollToTop: '&',
        scrollToBottom: '&',
        openPreviewTree: '&',
        publicationCtrl: '&'
      }
    };
  });

})(window, angular);
