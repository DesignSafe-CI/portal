(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('JobsStatusCtrl',
    ['$scope', '$rootScope', '$uibModal', 'Jobs', function($scope, $rootScope, $uibModal, Jobs) {
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

    // //does this work?  testing
    // function init(){
    //   $rootScope.$on('ds.wsBus:default', processMessage);
    // }

    // function processMessage(event, msg){
    //   if(msg.eventType !== 'data'){
    //       return;
    //   }
    //   dataVM[msg.data.callback](msg.data.path);
    //   //getList(action);
    // }

  }]);

  angular.module('WorkspaceApp').controller('JobDetailsModalCtrl', function($scope, $uibModalInstance, job) {
    $scope.job = job;
    $scope.dismiss = function() {
      $uibModalInstance.dismiss('cancel');
    };
  });
})(window, angular, jQuery);