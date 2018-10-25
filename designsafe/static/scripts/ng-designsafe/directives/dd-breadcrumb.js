/**
 *
 */
export function ddBreadcrumb() {
    'ngInject';
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
  }
