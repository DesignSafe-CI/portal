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
          'parameters',
          'inputs',
          {
            type: 'fieldset',
            title: 'Job details',
            items: ['name', 'archivePath']
          },
          {type: 'actions', items: [
            {type: 'submit', title: 'Run', style: 'btn-primary'},
            {type: 'button', title: 'Cancel', style: 'btn-link', onClick: 'closeApp()'}
          ]}
        ];
        // console.log($scope.form);
      };

      $scope.onSubmit = function(form) {
        $scope.$broadcast('schemaFormValidate');
        if (form.$valid) {
          var jobData = {
              appId: $scope.data.app.id,
              archive: true,
              inputs: [],
              parameters: []
          };
          /* copy form model to disconnect from $scope */
          _.extend(jobData, angular.copy($scope.form.model));
          /* remove falsy input/parameter */
          _.each(jobData.inputs, function(v,k) {
            if (_.isArray(v)) {
              v = _.compact(v);
              if (v.length === 0) {
                delete jobData.inputs[k];
              }
            }
          });
          _.each(jobData.parameters, function(v,k) {
            if (_.isArray(v)) {
              v = _.compact(v);
              if (v.length === 0) {
                delete jobData.parameters[k];
              }
            }
          });
          Jobs.submit(jobData).then(
            function(resp) {
              $rootScope.$broadcast('job-submitted', resp.data);
              $scope.data.job = resp.data;
              $scope.form.form[$scope.form.form.length - 1].items[0] = {
                type: 'button',
                title: 'Clear Form',
                style: 'btn-default',
                onClick: 'resetForm()'
              };
            }, function(err) {
              window.alert(err.data.message);
            });
        }
      };

      function closeApp() {
        $scope.data.app = null;
        $scope.data.job = null;
      }

      $scope.$on('close-app', closeApp)

      $scope.closeApp = function() {
        $rootScope.$broadcast('close-app', $scope.data.app.id);
        closeApp();
      }
    }]);
})(window, angular, jQuery);
