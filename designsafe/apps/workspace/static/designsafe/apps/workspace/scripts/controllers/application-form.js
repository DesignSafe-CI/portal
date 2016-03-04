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
        $scope.data.needsLicense = $scope.data.app.license.type && !$scope.data.app.license.enabled;
        $scope.data.job = null;
        $scope.form = {model: {}, readonly: $scope.data.needsLicense};
        $scope.form.schema = Apps.formSchema($scope.data.app);
        $scope.form.form = [];

        /* inputs */
        var items = [];
        if ($scope.form.schema.properties.inputs) {
          items.push('inputs');
        }
        if ($scope.form.schema.properties.parameters) {
          items.push('parameters');
        }
        $scope.form.form.push({
          type: 'fieldset',
          readonly: $scope.data.needsLicense,
          title: 'Inputs',
          items: items
        });

        /* job details */
        $scope.form.form.push({
          type: 'fieldset',
          readonly: $scope.data.needsLicense,
          title: 'Job details',
          items: ['name', 'archivePath']
        });

        /* buttons */
        items = [];
        if (! $scope.data.needsLicense) {
          items.push({type: 'submit', title: 'Run', style: 'btn-primary'});
        }
        items.push({type: 'button', title: 'Close', style: 'btn-link', onClick: 'closeApp()'});
        $scope.form.form.push({
          type: 'actions',
          items: items
        });
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

          $scope.data.submitting = true;
          Jobs.submit(jobData).then(
            function(resp) {
              $scope.data.submitting = false;
              $rootScope.$broadcast('job-submitted', resp.data);
              $scope.data.job = resp.data;
              $scope.form.form[$scope.form.form.length - 1].items[0] = {
                type: 'button',
                title: 'Clear Form',
                style: 'btn-default',
                onClick: 'resetForm()'
              };
            }, function(err) {
              $scope.data.submitting = false;
              var error_message = err.data.message || 'Unexpected error';

              var notice = 'Your job submission failed with the following message:\n\n' + error_message +
                           '\n\nPlease try again. If this problem persists, please submit a support ticket.';
              window.alert(notice);
            });
        }
      };

      function closeApp() {
        $scope.data.app = null;
        $scope.data.job = null;
        $scope.data.appLicenseEnabled = false;
      }

      $scope.$on('close-app', closeApp)

      $scope.closeApp = function() {
        $rootScope.$broadcast('close-app', $scope.data.app.id);
        closeApp();
      };
    }]);
})(window, angular, jQuery);
