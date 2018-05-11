(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddAltmetrics', ['$sce', '$filter', function ($sce, $filter, $scope) {
    return {
      restrict: 'EA',
      link: function (scope, element) {
        scope.$watch('ld', function (schema) {
          var schema = $sce.trustAsHtml($filter('json')(schema));
          element[0].outerHTML = '<script type="application/ld+json">' + schema + '</script>';
        });
      }
    };
  }]);
})(window, angular);