/**
 *
 */
export const ddBreadcrumb = function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddBreadcrumb', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      template: require('../html/directives/dd-breadcrumb.html'),
      scope: {
        listing: '=',
        skipRoot: '=',
        customRoot: '=',
        onBrowse: '&',
        itemHref: '&'
      },
      link: function(scope) {
        scope.offset = 0;
        if (scope.skipRoot || scope.customRoot) {
          scope.offset = 1;
        }
      }
    };
  });

}