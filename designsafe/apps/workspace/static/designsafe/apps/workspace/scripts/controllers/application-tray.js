(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl',
    ['$scope', '$rootScope', 'Apps', function($scope, $rootScope, Apps) {

      $scope.data = {};
      $scope.data.apps = Apps.list();

      $scope.$on('close-app', function(e, appId) {
        var app = _.findWhere($scope.data.apps, {'id':appId});
        if (app) {
          app._active = false;
        }
      });

      $scope.launchApp = function(app) {
        app._active = true;
        $rootScope.$broadcast('launch-app', app.id);
      };
    }]);

})(window, angular, jQuery, _);