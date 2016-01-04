(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl', ['$scope', function($scope) {

    $scope.data = {};
    $scope.data.apps = [{name:'opensees'}];

  }]);

})(window, angular, jQuery);