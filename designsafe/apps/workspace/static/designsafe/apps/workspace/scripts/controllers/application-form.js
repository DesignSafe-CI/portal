(function(window, angular, $) {
  "use strict";
  angular.module('designsafe')
  .directive('compile', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
      scope.$watch(
        function (scope) {
          return scope.$eval(attrs.compile);
        },
        function (value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };
  }])
  .controller('ApplicationFormCtrl',
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

      Jobs.getWebhookUrl().then(function(response) {
        $scope.webhookUrl = response.data;
      });

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
        //reset formValid, var is used for invalid form msg
        $scope.data.formValid = [];

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
          //set formValid to true, var is used for invalid error msg
          $scope.data.formValid = true;
          var jobData = {
              appId: $scope.data.app.id,
              archive: true,
              inputs: {},
              parameters: {},
              notifications: [
                /*
                {
                  url: "http://90370984.ngrok.io/api/notifications/wh/jobs/",
                  event: "*",
                  persistent: true
                },
                */
                
                {
                  url: $scope.webhookUrl,
                  event: "PENDING",
                },
                {
                  url: $scope.webhookUrl,
                  event: "QUEUED",
                },
                {
                  url: $scope.webhookUrl,
                  event: "SUBMITTING",
                },
                {
                  url: $scope.webhookUrl,
                  event: "PROCESSING_INPUTS",
                },
                {
                  url: $scope.webhookUrl,
                  event: "STAGED",
                },
                {
                  url: $scope.webhookUrl,
                  event: "RUNNING",
                },
                {
                  url: $scope.webhookUrl,
                  event: "KILLED",
                },
                {
                  url: $scope.webhookUrl,
                  event: "FAILED",
                },
                {
                  url: $scope.webhookUrl,
                  event: "STOPPED",
                },
                {
                  url: $scope.webhookUrl,
                  event: "FINISHED",
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
        else {
          // set a variable so we can show an error message when form is not valid
          $scope.data.formValid = false;
        }
      };

      $scope.onLaunchNotebook = function(href) {
        let file_path = '/SCEC_BBP_GMportal/Run_me.ipynb'; // app.file_path
        let file_mgr_name = 'community';
        let system_id = 'designsafe.storage.community';
        $scope.data.launching = true;
        Apps.copyNotebook(file_mgr_name, system_id, file_path)
        .then(function(resp) {
          $scope.data.launching = false;
          window.open(`${href}/user/${resp.data.path.split('/')[1]}/notebooks/mydata/${resp.data.name}`,'').focus();
          }, function (err) {
            scope.data.launching = false;
          });
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
