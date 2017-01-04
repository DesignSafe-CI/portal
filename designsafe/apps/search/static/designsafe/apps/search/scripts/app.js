(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe')
  .config(["$httpProvider", "$locationProvider", function ($httpProvider, $locationProvider) {
     $httpProvider.defaults.transformResponse.push(function(responseData){
        convertDateStringsToDates(responseData);
        return responseData;
      });
       $locationProvider.html5Mode(true);
  }]);

  angular.module('designsafe').controller('SearchCtrl',
    ['$scope','$rootScope', '$location', 'searchService', 'Logging', 'djangoUrl',
    function($scope, $rootScope, $location, searchService, Logging, djangoUrl) {
      $scope.data = {};
      $scope.Math = window.Math;
      $scope.counter = Array;
      $scope.results_per_page = 10;
      $scope.offset = 0;
      $scope.data.search_text = null;
      $scope.data.type_filter = null;
      $scope.filetype_filter = 'all';
      $scope.inital_q = $location.search().q

      $scope.search = function(){
        if ($scope.data.search_text) {

          searchService.search($scope.data.search_text, $scope.limit, $scope.offset, $scope.data.type_filter).then(function(resp) {
              $scope.data.search_results = resp.data;
              // logger.debug($scope.data.search_results)
              console.log($scope.data.search_results)
              $scope.page_num = 0;
              $scope.offset = 0;

          });
        }
      };

      $scope.filter = function (ftype) {
        if ($scope.data.type_filter === ftype) {
          $scope.data.type_filter = null;
        } else {
          $scope.data.type_filter = ftype;
        }
        $scope.search();
      };

      $scope.select_page = function (page_num) {
        $scope.page_num = page_num;
        $scope.offset = page_num * $scope.results_per_page;
        $scope.search();
      }

      if ($scope.inital_q) {
        $scope.data.search_text = $scope.inital_q;
        $scope.search();
      }
  }]);

  var regexIso8601 = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

  function convertDateStringsToDates(input) {
    // Ignore things that aren't objects.
    if (typeof input !== "object") return input;

    for (var key in input) {
        if (!input.hasOwnProperty(key)) continue;

        var value = input[key];
        var match;
        // Check for string properties which look like dates.
        if (typeof value === "string" && (match = value.match(regexIso8601))) {
            var milliseconds = Date.parse(match[0])
            if (!isNaN(milliseconds)) {
                input[key] = new Date(milliseconds);
            }
        } else if (typeof value === "object") {
            // Recurse into object
            convertDateStringsToDates(value);
        }
    }
}

})(window, angular, jQuery, _);
