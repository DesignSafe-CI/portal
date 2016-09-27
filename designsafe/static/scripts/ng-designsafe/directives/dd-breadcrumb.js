/**
 *
 */
(function(window, angular) {

  var module = angular.module('ng.designsafe');

  module.directive('ddBreadcrumb', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/dd-breadcrumb.html',
      scope: {
        listing: '=',
        onBrowse: '&',
        itemHref: '&'
      }
    };
  });

})(window, angular);
