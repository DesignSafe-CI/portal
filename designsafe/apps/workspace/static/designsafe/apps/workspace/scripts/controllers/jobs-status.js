(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('JobsStatusCtrl',
  ['$scope', '$controller', '$rootScope', '$uibModal', 'djangoUrl', 'Jobs', function($scope, $controller, $rootScope, $uibModal, djangoUrl, Jobs) {
    $controller('WorkspacePanelCtrl', {$scope: $scope});
    $scope.data = {};

    $scope.jobDetails = function(job) {
      Jobs.get(job.id).then(function(resp) {
        console.log(resp.data);

        $uibModal.open({
          templateUrl: 'local/job-details-modal.html',
          controller: 'JobDetailsModalCtrl',
          resolve: {
            job: resp.data
          }
        });
      });
    };

    $scope.refresh = function() {
      $scope.data.loading = true;
      Jobs.list().then(function(resp) {
        $scope.data.loading = false;
        $scope.data.jobs = resp.data;
      });
    };
    $scope.refresh();

    $scope.$on('job-submitted', function(e, data) {
      console.log(data);
      $scope.refresh();
    });

    $scope.$on('jobs-refresh', function(e, data) {
      console.log('jobs-refresh event detected with data: ', data);
      $scope.refresh();
    });

    $scope.$on('ds.wsBus:default', function update_job(e, msg){
      console.log('update job msg', msg)
      if('event_type' in msg && msg.event_type === 'VNC') {
        //alert(msg.connection_address)
        $scope.interactive_url = djangoUrl.reverse('designsafe_workspace:interactive2', { 'hostname': msg.host, 'port':msg.port , 'password':msg.password });
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
            if ($scope.data.jobs[i]['id'] == msg.job_id) {
              $scope.data.jobs[i]['status'] = msg.status;
              $scope.$apply()
              break;
            }
        }
      }
    });



  }]);

  angular.module('WorkspaceApp').controller('JobDetailsModalCtrl',
    [ '$scope', '$uibModalInstance','$http', 'Jobs', 'job', 'djangoUrl',  function($scope, $uibModalInstance, $http, Jobs, job, djangoUrl) {

    $scope.job = job;

    $scope.dismiss = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.deleteJob = function() {
      console.log('deleteJob button clicked with jobId=',job.id);
      $http.delete(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
        params: {'job_id': job.id},

      }).then(function(response){
        $uibModalInstance.dismiss('cancel');
        $scope.$parent.$broadcast('jobs-refresh');
      }, function(error) {
        console.log('nope!', error); //todo make error handling UI
      });
    };

    $scope.cancelJob = function() {
      console.log('cancelJob button clicked with jobId=',job.id);
      $http.post(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
        'job_id': job.id, params: {'job_id': job.id, 'action':'cancel', 'body':'{"action":"stop"}'},
      }).then(function(response){
        $uibModalInstance.dismiss('cancel');
        $scope.$parent.$broadcast('jobs-refresh');
      }, function(error) {
        console.log('nope!', error); //todo make error handling UI
      });
    };

  }]);

  angular.module('WorkspaceApp').controller('VNCJobDetailsModalCtrl', function($scope, $uibModalInstance, msg) {
    $scope.msg = msg;
    $scope.dismiss = function() {
      $uibModalInstance.dismiss('cancel');
    };
  });

})(window, angular, jQuery);
