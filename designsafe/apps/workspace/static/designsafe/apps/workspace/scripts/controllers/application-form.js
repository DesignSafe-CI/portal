(function(window, angular, $) {
  "use strict";
  angular.module('designsafe').controller('ApplicationFormCtrl',
    ['$scope', '$rootScope', '$localStorage', '$location', '$anchorScroll', '$translate', 'Apps', 'Jobs', 'Systems', '$mdToast',
    function($scope, $rootScope, $localStorage, $location, $anchorScroll, $translate, Apps, Jobs, Systems, $mdToast) {

      $localStorage.systemChecks = {};

      $scope.data = {
        messages: [],
        submitting: false,
        needsLicense: false,
        unavailable: false,
        app: null,
        form: {}
      };

      $scope.$on('launch-app', function(e, app) {
        $scope.error = '';

        if ($scope.data.app) {
          $rootScope.$broadcast('close-app', $scope.data.app.id);
        }

          if (app.value.type === 'agave'){
            $scope.data.type = app.value.type;
            Apps.get(app.value.definition.id).then(
              function(resp) {
              // check app execution system
              // Systems.getMonitor(resp.data.executionSystem)
              //   .then(
              //     function(response){
              //       if (response.data.length > 0){
              //           // perform check only when monitor is active
              //           if (response.data[0].active){
              //             if (response.data[0].lastSuccess !== null){
              //               var currentDate = new Date();
              //               var monitorLastSuccessDate = Date.parse(response.data[0].lastSuccess);
              //               var diff = Math.abs((currentDate - monitorLastSuccessDate) / 60000);

              //               if (diff > response.data[0].frequency){
              //                 $mdToast.show($mdToast.simple()
              //                 .content($translate.instant('error_system_monitor'))
              //                 .toastClass('warning')
              //                 .parent($("#toast-container")));
              //               }
              //             } else {
              //               $mdToast.show($mdToast.simple()
              //               .content($translate.instant('error_system_monitor'))
              //               .toastClass('warning')
              //               .parent($("#toast-container")));
              //             }
              //         }
              //       }
              //     });

              $scope.data.app = resp.data;
              $scope.resetForm();
            });
          } else if (app.value.type === 'html'){
                $scope.data.type = app.value.type;
                $scope.data.app = app.value.definition.html;
          }
      });

      $scope.resetForm = function() {
        $scope.data.needsLicense = $scope.data.app.license.type && !$scope.data.app.license.enabled;
        $scope.data.unavailable = ($scope.data.app.executionSystem == "designsafe.community.exec.stampede" || $scope.data.app.executionSystem == "designsafe.community.exec.stampede.nores");
        $scope.form = { model: {}, readonly: ($scope.data.needsLicense || $scope.data.unavailable)};
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
          readonly: ($scope.data.needsLicense || $scope.data.unavailable),
          title: 'Inputs',
          items: items
        });

        /* job details */
        items = [];
        if ($scope.data.app.tags.includes('Interactive')) {
          items.push('name');
        } else {
          items.push('maxRunTime', 'name', 'archivePath');
        }
        if ($scope.data.app.parallelism == "PARALLEL") {
          items.push('nodeCount');
        }
        $scope.form.form.push({
          type: 'fieldset',
          readonly: ($scope.data.needsLicense || $scope.data.unavailable),
          title: 'Job details',
          items: items
        });

        /* buttons */
        items = [];
        if (!($scope.data.needsLicense || $scope.data.unavailable)) {
          items.push({type: 'submit', title: ($scope.data.app.tags.includes('Interactive') ? 'Launch' : 'Run'), style: 'btn-primary'});
        }
        items.push({type: 'button', title: 'Close', style: 'btn-link', onClick: 'closeApp()'});
        $scope.form.form.push({
          type: 'actions',
          items: items
        });
      };

      $scope.onSubmit = function(form) {
        $scope.data.messages = [];
        $scope.$broadcast('schemaFormValidate');
        if (form.$valid) {
          var jobData = {
              appId: $scope.data.app.id,
              archive: true,
              inputs: {},
              parameters: {},
              notifications: [
                {
                  url: "https://hookb.in/vqL9bq9J",
                  event: "*",
                  persistent: true
                },
                {
                  url: "https://putsreq.com/b1oE4asB4dNNQWkZGxUV",
                  event: "UPDATED",
                  persistent: true
                }
                

              ]
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

          // Calculate processorsPerNode if nodeCount parameter submitted
          if (_.has(jobData, 'nodeCount')) {
            jobData.processorsPerNode = jobData.nodeCount * ($scope.data.app.defaultProcessorsPerNode / $scope.data.app.defaultNodeCount);
          }

          $scope.data.submitting = true;
          Jobs.submit(jobData).then(
            function(resp) {
              $scope.data.submitting = false;
              $rootScope.$broadcast('job-submitted', resp.data);
              $scope.data.messages.push({
                type: 'success',
                header: 'Job Submitted Successfully',
                body: 'Your job <em>' + resp.data.name + '</em> has been submitted. Monitor its status on the right.'
              });
              $scope.resetForm();
              refocus();
            }, function(err) {
              $scope.data.submitting = false;
              $scope.data.messages.push({
                type: 'danger',
                header: 'Job Submit Failed',
                body: 'Your job submission failed with the following message:<br>' +
                      '<em>' + (err.data.message || 'Unexpected error') + '</em><br>' +
                      'Please try again. If this problem persists, please ' +
                      '<a href="/help" target="_blank">submit a support ticket</a>.'
              });
              refocus();
            });
        }
      };

      function refocus() {
        $location.hash('workspace');
        $anchorScroll();
      }

      function closeApp() {
        $scope.data.app = null;
        $scope.data.appLicenseEnabled = false;
      }

      $scope.$on('close-app', closeApp);

      $scope.closeApp = function() {
        $rootScope.$broadcast('close-app', $scope.data.app.id);
        closeApp();
      };
    }]);
})(window, angular, jQuery);
