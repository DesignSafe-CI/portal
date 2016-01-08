(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationFormCtrl',
    ['$scope', '$rootScope', 'Apps', 'Jobs', function($scope, $rootScope, Apps, Jobs) {
      $scope.data = {};

      $scope.$on('launch-app', function(e, appId) {
        if ($scope.data.app) {
          $rootScope.$broadcast('close-app', $scope.data.app.id);
        }
        Apps.get(appId).then(function(resp) {
          $scope.data.app = resp.data;
          $scope.resetForm();
        });
      });

      $scope.resetForm = function() {
        $scope.data.job = null;
        $scope.form = {model: {}};
        $scope.form.schema = Apps.formSchema($scope.data.app);
        $scope.form.form = [
          '*',
          {type: 'actions', items: [
            {type: 'submit', title: 'Run', style: 'btn-primary'},
            {type: 'button', title: 'Cancel', style: 'btn-link', onClick: 'closeApp()'}
          ]}
        ];
        // console.log($scope.form);
      };

      $scope.onSubmit = function(form) {
        var jobData = {
          appId: $scope.data.app.id,
          name: $scope.form.model.name,
          archive: true,
          inputs: $scope.form.model.inputs || [],
          parameters: $scope.form.model.parameters || []
        };
        Jobs.submit(jobData).then(
          function(resp) {
            $rootScope.$broadcast('job-submitted', resp.data);
            $scope.data.job = resp.data;
            $scope.form.form[1].items[0] = {
              type: 'button',
              title: 'Clear Form',
              style: 'btn-default',
              onClick: 'resetForm()'
            };
          }, function(err) {
            window.alert(err.data.message);
          });
      };

      $scope.closeApp = function() {
        $rootScope.$broadcast('close-app', $scope.data.app.id);
        $scope.data.app = null;
        $scope.data.job = null;
      }
    }]);
})(window, angular, jQuery);