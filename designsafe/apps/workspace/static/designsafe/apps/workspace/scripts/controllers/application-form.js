(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationFormCtrl',
    ['$scope', '$rootScope', 'Apps', function($scope, $rootScope, Apps) {
      $scope.data = {};

      $scope.$on('launch-app', function(e, appId) {
        var app = Apps.get(appId);
        $scope.data.app = app;
        $scope.form = {
          schema: Apps.formSchema(app),
          model: {},
          form: [
            '*',
            {type: 'actions', items: [
              {type: 'submit', title: 'Run', style: 'btn-primary'},
              {type: 'button', title: 'Cancel', style: 'btn-link', onClick: 'closeApp()'}
            ]}
          ]
        };
      });

      $scope.onSubmit = function(form) {
        console.log($scope.form.model);
      };

      $scope.closeApp = function() {
        $rootScope.$broadcast('close-app', $scope.data.app.id);
        $scope.data.app = null;
      }
    }]);
})(window, angular, jQuery);