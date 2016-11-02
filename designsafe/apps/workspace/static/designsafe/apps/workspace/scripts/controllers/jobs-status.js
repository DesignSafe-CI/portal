(function(window, angular, $) {
  "use strict";
  angular.module('designsafe').controller('JobsStatusCtrl',
  ['$scope', '$controller', '$rootScope', '$uibModal', 'djangoUrl', 'Jobs', 'logger', 'NotificationService', function($scope, $controller, $rootScope, $uibModal, djangoUrl, Jobs, logger, NotificationService) {

    NotificationService.processors.job = {
          'process': function notifyProcessor(msg){
            logger.log('processing msg: ', msg);
            return msg.extra;
          },
          'renderLink': function renderLink(msg){
          logger.log('rendering link: ', msg);
              return msg.extra['target_path'] // this will only be present when indexing is completed
          }
        };

    $controller('WorkspacePanelCtrl', {$scope: $scope});
    $scope.data = {
      hasMoreJobs: true,
      limit: 10
    };

    $scope.jobDetails = function(job) {
      Jobs.get(job.id).then(function(resp) {
        $scope.data.interactive = false;
        if(resp.data.status === 'RUNNING' && resp.data._embedded.metadata) {
          for(var i=0; i < resp.data._embedded.metadata.length; i++){
            if(resp.data._embedded.metadata[i].name === 'interactiveJobDetails') {
              var meta = resp.data._embedded.metadata[i];
              $scope.data.interactive = true;
              $scope.data.connection_address = meta.value.extra.target_uri;
              break;
            }
          }
        }

        $uibModal.open({
          templateUrl: 'local/job-details-modal.html',
          controller: 'JobDetailsModalCtrl',
          scope: $scope,
          resolve: {
            job: resp.data,
          }
        });
      });
    };

    $scope.refresh = function() {
      $scope.data.loading = true;
      Jobs.list({limit: $scope.data.limit}).then(
        function(resp) {
          $scope.data.loading = false;
          $scope.data.jobs = resp.data;
        });
    };
    $scope.refresh();

    $scope.loadMore = function() {
      $scope.data.limit += 10;
      $scope.refresh();
    };

    $scope.$on('job-submitted', function(e, data) {
      logger.log(data);
      $scope.refresh();
    });

    $scope.$on('jobs-refresh', function(e, data) {
      logger.log('jobs-refresh event detected with data: ', data);
      $scope.refresh();
    });

    /*
     * Receives the webhook notification from the vnc-type job and opens the
     * modal dialog in the workspace letting the user know their job is ready
     * to connect to.
     */
    $scope.$on('ds.wsBus:default', function update_job(e, msg){
      if('event_type' in msg && msg.event_type === 'VNC') {
        $uibModal.open({
          templateUrl: 'local/vncjob-details-modal.html',
          controller: 'VNCJobDetailsModalCtrl',
          scope: $scope,
          resolve: {
            msg: msg
          }
        });
      }
      else {
        for (var i=0; i < $scope.data.jobs.length; i++){
            if ($scope.data.jobs[i]['id'] == msg.extra.id) {
              $scope.data.jobs[i]['status'] = msg.extra.status;
              $scope.$apply();
              break;
            }
        }
      }
    });


  }]);

  angular.module('designsafe').controller('JobDetailsModalCtrl',
    [ '$scope', '$uibModalInstance','$http', 'Jobs', 'job', 'djangoUrl', 'logger', function($scope, $uibModalInstance, $http, Jobs, job, djangoUrl, logger) {

    $scope.job = job;

    $scope.dismiss = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.deleteJob = function() {
      logger.log('deleteJob button clicked with jobId=',job.id);
      $http.delete(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
        params: {'job_id': job.id},

      }).then(function(response){
        $uibModalInstance.dismiss('cancel');
        $scope.$parent.$broadcast('jobs-refresh');
      }, function(error) {
        logger.log('nope!', error); //todo make error handling UI
      });
    };

    $scope.cancelJob = function() {
      logger.log('cancelJob button clicked with jobId=',job.id);
      $http.post(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
        'job_id': job.id, params: {'job_id': job.id, 'action':'cancel', 'body':'{"action":"stop"}'},
      }).then(function(response){
        $uibModalInstance.dismiss('cancel');
        $scope.$parent.$broadcast('jobs-refresh');
      }, function(error) {
        logger.log('nope!', error); //todo make error handling UI
      });
    };

  }]);

  angular.module('designsafe').controller('VNCJobDetailsModalCtrl', function($scope, $uibModalInstance, msg) {
    $scope.msg = msg;
    $scope.dismiss = function() {
      $uibModalInstance.dismiss('cancel');
    };
  });

})(window, angular, jQuery);
