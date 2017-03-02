(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').directive('searchListing', function () {
    return {
      restrict: 'E',
      templateUrl: '/static/designsafe/apps/search/html/searchListing.html',
      scope: {'data' : '=data'},
    }
  });

  angular.module('designsafe').filter('removeHTMLTags', function () {
    return function (text) {
      // return text ? String(text).replace(/<[^>]+>/gm, '') : '';
      return text ? String(text).replace(/<(?!strong\s*\/?)[^>]+>/g, '') : '';

    };
  })

  angular.module('designsafe').filter('trusted',
   function($sce) {
     return function(ss) {
       return $sce.trustAsHtml(ss)
     };
   }
)
})(window, angular, jQuery, _);
