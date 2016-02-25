(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl',
    ['$scope', '$rootScope', 'Apps', function($scope, $rootScope, Apps) {

      $scope.data = {
        activeApp: null,
        publicOnly: false
      };

      function closeApp(appId) {
        $rootScope.$broadcast('close-app', appId);
        $scope.data.activeApp = null;
      }

      $scope.$on('close-app', function(e, appId) {
        if ($scope.data.activeApp && $scope.data.activeApp.id === appId) {
          $scope.data.activeApp = null;
        }
      });

      $scope.refreshApps = function() {
        $scope.data.apps = null;
        if ($scope.data.activeApp) {
          closeApp($scope.data.activeApp.id);
        }

        Apps.list({publicOnly: $scope.data.publicOnly}).then(function(response) {
          $scope.data.apps = response.data;
        });
      };
      $scope.refreshApps();

      $scope.launchApp = function(app) {
        if (!$scope.data.activeApp || $scope.data.activeApp.id !== app.id) {
          $scope.data.activeApp = app;
          $rootScope.$broadcast('launch-app', app.id);
        }
      };
    }]);

})(window, angular, jQuery, _);
