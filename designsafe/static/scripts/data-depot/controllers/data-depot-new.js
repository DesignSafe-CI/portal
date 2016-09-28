(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotNewCtrl', ['$scope', '$uibModal', 'FilesService', function($scope, $uibModal, FilesService) {

    $scope.uploadFiles = function() {};

    $scope.uploadFolders = function() {};

    $scope.createFolder = function() {

      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-create-folder.html',
        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
          $scope.form = {
            folderName: 'Untitled_folder'
          };

          $scope.doCreateFolder = function($event) {
            $event.preventDefault();
            $uibModalInstance.close($scope.form.folderName);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        }]
      });

      modal.result.then(function(folderName) {
        $scope.state.loading = true;
        FilesService.mkdir({
          file_id: $scope.data.listing.id,
          resource: $scope.data.listing.source,
          dir_name: folderName
        }).then(function(resp) {
          $scope.data.listing.children.push(resp.data);
          $scope.state.loading = false;
        }, function(err) {
          $scope.$emit('designsafe:notify', {
            level: 'warning',
            message: 'Unable to create directory: ' + err.data.message
          });
          logger.error(err);
          $scope.state.loading = false;
        });
      });

    };

    $scope.createProject = function() {};

  }]);


})(window, angular);
