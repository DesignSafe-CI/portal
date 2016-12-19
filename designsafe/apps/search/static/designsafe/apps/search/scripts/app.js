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

  app.filter('bytes', function() {
    return function(bytes, precision) {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
      if (typeof precision === 'undefined') precision = 1;
      var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
  });

})(window, angular, jQuery, _);
