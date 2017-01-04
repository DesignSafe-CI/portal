(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').directive('searchListing', function () {
    return {
      restrict: 'E',
      templateUrl: '/static/designsafe/apps/search/html/searchListing.html',
      scope: {'data' : '=data'},
    }
  });
})(window, angular, jQuery, _);
