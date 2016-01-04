(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl', ['$scope', 'Apps', function($scope, Apps) {

    $scope.data = {};
    $scope.data.apps = Apps.list();

    $scope.launchApp = function(app) {
      window.alert('GET ' + app._links.self.href);
    };
  }]);

})(window, angular, jQuery);