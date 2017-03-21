(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').controller('ApplicationSystemsRoleCtrl',
    ['$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$translate', '$state', 'Apps', 'Django', function($scope, $rootScope, $q, $timeout, $uibModal, $translate, $state, Apps, Django) {

        $scope.getSystemRoles = function(){
          $scope.requesting = true;
          var execSystem = $translate.instant('execution_default');

          Apps.getSystemRoles(execSystem)
            .then(
              function(response){
                if (Django.user === 'ds_admin'){
                  $scope.requesting = true;
                  $state.go('applications-add-admin');
                } else {
                  _.each(response.data, function(role){
                    if (role.username === Django.user){
                      if (role.role === 'ADMIN' || role.role === 'PUBLISHER' || role.role === 'OWNER'){
                        $state.go('applications-add');
                      }
                    }
                  });
                  $scope.requesting = false;
                }
              },
              function(response){
                if (response.data) {
                  if (response.data.message){
                    $scope.error = $translate.instant('error_app_system_roles') + response.data.message;
                  } else {
                    $scope.error = $translate.instant('error_app_system_roles') + response.data;
                  }
                } else {
                  $scope.error = $translate.instant('error_app_system_roles');
                }
                $scope.requesting = false;
              }
            );
      };

      $scope.getSystemRoles();

    }]);
})(window, angular, jQuery, _);
