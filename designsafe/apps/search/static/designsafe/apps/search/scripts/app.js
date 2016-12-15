(function(window, angular, $, _) {
  "use strict";

  var app = angular.module('designsafe');
  app.requires.push('djng.urls', 'logging');


  angular.module('designsafe').controller('SearchCtrl', ['$scope','$rootScope','searchFactory', 'Logging', 'djangoUrl', 
    function($scope, $rootScope, searchFactory, Logging, djangoUrl) {
      $scope.data = {};
      $scope.data.search_text = null;
      var logger = Logging.getLogger('DesignSafe.search');

      $scope.search = function(){
        console.log("searching", $scope.data.search_text)
        if ($scope.data.search_text) {
          searchFactory.search($scope.data.search_text).then(function(resp) {
              $scope.data.search_results = resp.data;

              logger.debug($scope.data.search_results)
          });
        }
      };
  }]);

})(window, angular, jQuery, _);
