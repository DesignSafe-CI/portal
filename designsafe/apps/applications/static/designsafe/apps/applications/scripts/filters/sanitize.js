(function(window, angular, $, _) {
  "use strict";
  angular.module('ApplicationsApp').filter('toTrusted', function ($sce) {
    return function (value) {
        return $sce.trustAsHtml(value);
    };
  })
})(window, angular, jQuery, _);
