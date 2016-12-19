(function(window, angular, $, _) {
  "use strict";


  angular.module('designsafe').directive('searchFileListing', function () {
    return {
      restrict: 'E', 
      templateUrl: '/static/designsafe/apps/search/html/fileListing.html', 
      scope: {'data' : '=data'},
    }
  });
  angular.module('designsafe').directive('searchProjectListing', function () {
    return {
      restrict: 'E', 
      templateUrl: '/static/designsafe/apps/search/html/projectListing.html', 
      scope: {'data' : '=data'},
    }
  });
  angular.module('designsafe').directive('searchExperimentListing', function () {
    return {
      restrict: 'E', 
      templateUrl: '/static/designsafe/apps/search/html/experimentListing.html', 
      scope: {'data' : '=data'},
    }
  });
})(window, angular, jQuery, _);
