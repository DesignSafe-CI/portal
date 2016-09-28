(function(window, angular, $, _) {
  "use strict";
  angular.module('ApplicationsApp').service('AppsPems', ['$http', '$q', '$rootScope', '$uibModal', 'djangoUrl', function($http, $q, $rootScope, $uibModal, djangoUrl) {
    this.editPermissions = function(resource){
        var modalInstance = $uibModal.open({
          templateUrl: '/static/designsafe/apps/applications/html/application-pems.html',
          scope: $rootScope,
          resolve:{
              resource: function() {
                return resource;
              },
          },
          controller: ['$scope', '$uibModalInstance', 'resource',
            function($scope, $uibModalInstance, resource){
              $scope.resource = resource;

              $scope.uuid = '';

              $scope.getRwxObj = function() {
                  return {
                        read: false,
                        write: false,
                        execute: false
                  };
              };

              $scope.transformRwxToAgave = function(rwxObj) {
                var result = '';
                if (rwxObj.read === true && rwxObj.write === true && rwxObj.execute === true){
                  result = 'ALL';
                }
                else if (rwxObj.read === true && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')){
                  result = 'READ';
                }
                else if ((rwxObj.read === false || typeof rwxObj.read === 'undefined') && rwxObj.write === true && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')) {
                  result = 'WRITE';
                }
                else if ((rwxObj.read === false || typeof rwxObj.read === 'undefined') && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && rwxObj.execute === true) {
                  result = 'EXECUTE';
                }
                else if (rwxObj.read === true && rwxObj.write === true && (rwxObj.execute === false || typeof rwxObj.execute === 'undefined')) {
                  result = 'READ_WRITE';
                }
                else if (rwxObj.read === true && (rwxObj.write === false || typeof rwxObj.write === 'undefined') && rwxObj.execute === true) {
                  result = 'READ_EXECUTE';
                }
                else if ((rwxObj.read === false || rwxObj.read === 'undefined') && rwxObj.write === true && rwxObj.execute === true) {
                  result = 'WRITE_EXECUTE';
                }
                else {
                  result = 'NONE';
                }
                return result;
              };

              $scope.mapAppPemsToMetaPems = function(permission) {
                var result = angular.copy(permission);

                switch(result.permission){
                    case "ALL":
                    case "READ":
                    case "WRITE":
                        return result;
                    case "WRITE_EXECUTE":
                        result.permission = "READ_WRITE";
                        return result;
                    case "EXECUTE":
                    case "READ_EXECUTE":
                        result.permission = "READ";
                        return result;
                    case "READ_WRITE":
                        return result;
                    case "NONE":
                        return result;
                    default:
                        return result;
                }
              };

              $scope.transformAgaveToRwx = function(agavePermission) {
                var rwxObj = $scope.getRwxObj();

                switch(agavePermission){
                    case "ALL":
                        rwxObj.read = true;
                        rwxObj.write = true;
                        rwxObj.execute = true;
                      break;
                    case "READ":
                        rwxObj.read = true;
                      break;
                    case "WRITE":
                        rwxObj.write = true;
                      break;
                    case "EXECUTE":
                        rwxObj.execute = true;
                      break;
                    case "READ_WRITE":
                        rwxObj.read = true;
                        rwxObj.write = true;
                      break;
                    case "READ_EXECUTE":
                        rwxObj.read = true;
                        rwxObj.execute = true;
                      break;
                    case "WRITE_EXECUTE":
                        rwxObj.write = true;
                        rwxObj.execute = true;
                      break;
                    case "EXECUTE":
                        rwxObj.execute = true;
                      break;
                }

                return rwxObj;
              };

              $scope.refresh = function() {
                $scope.requesting = true;
                var query = {'name': 'ds_app', 'value.id': $scope.resource.id};

                // get metadata uuid to save later
                $http({
                  url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                  method: 'GET',
                  params: {'q': {'name': 'ds_app', 'value.id': $scope.resource.id} }
                }).then(
                  function(response){
                    $scope.uuid = '';
                    if (response.data.length > 0){
                      $scope.uuid = response.data[0].uuid;
                      // $http({
                      //   url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                      //   method: 'GET',
                      //   params: {'pems': true, 'uuid': $scope.uuid}
                      // }).then(
                      $http({
                        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                        method: 'GET',
                        params: {'appId': $scope.resource.id, 'pems': true}
                      }).then(
                        function(response) {
                          $scope.model = {};
                          $scope.tempModel = {};

                          $scope.schema =
                          {
                            "type": "object",
                            "title": "Complex Key Support",
                            "properties": {
                              "name": {
                                "type": "string",
                                "title": "Name"
                              },
                              "permissions": {
                                "title": "permissions by username",
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "username": {
                                      "title": " ",
                                      "type": "string"
                                    },
                                    "permission": {
                                      "title": " ",
                                      "type": "string",
                                      "enum": [
                                        "ALL",
                                        "READ",
                                        "EXECUTE",
                                        "READ_WRITE",
                                        "READ_EXECUTE",
                                        "WRITE_EXECUTE",
                                        "NONE"
                                      ]
                                    }
                                  },
                                }
                              },
                            }
                          };

                          $scope.form = [
                            {
                              "key": "permissions",
                              "items": [
                                {
                                  "type": "fieldset",
                                  "items": [
                                      {
                                        "type": "section",
                                        "htmlClass": "col-xs-6",
                                        "items": [
                                            {
                                              "key": "permissions[].username"
                                            }
                                        ],

                                      },
                                      {
                                        "type": "section",
                                        "htmlClass": "col-xs-6",
                                        "items": ["permissions[].permission"]
                                      }
                                  ]
                                }
                              ]
                            }
                          ];

                          var tempList = [];
                          $scope.tempModel.permissions = [];

                          angular.forEach(response.data, function(permission){
                            tempList.push({username: permission.username, permission:  $scope.transformRwxToAgave(permission.permission)});
                          });

                          // remove double listing of permissions for admin app owners
                          var uniqueTempList = _.uniq(tempList, function(permission){
                            return permission.username;
                          });
                          $scope.tempModel.permissions = angular.copy(uniqueTempList);

                          $scope.model.permissions = _.clone($scope.tempModel.permissions);
                          $scope.requesting = false;
                        },
                        function(response){
                          $scope.requesting = false;
                          var message = '';
                          if (response.data) {
                            message = 'Error updating permissions - ' + response.data;
                          } else {
                            message = 'Error updating permissions';
                          }
                          $scope.error = message;
                        }
                      )
                    }
                  },
                  function(response){
                    $scope.requesting = false;
                    var message = '';
                    if (response.data) {
                      message = 'Error updating permissions - ' + response.data;
                    } else {
                      message = 'Error updating permissions';
                    }
                    $scope.error = message;
                  }
                );
              };

              $scope.savePermissionChanges = function(){
                var deletedpermissions = _.difference($scope.model.permissions, $scope.tempModel.permissions);
                $scope.requesting = true;
                var promises = [];

                // Take care of deleted permissions first
                angular.forEach(deletedpermissions, function(permission){
                  if ($scope.resource.type === 'agave'){
                    promises.push(
                      $http({
                        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                        method: 'DELETE',
                        data: permission,
                        params: {'appId': resource.id, 'username': permission.username, 'pems': true}
                      })
                    );
                  }

                  promises.push(
                    $http({
                      url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                      method: 'DELETE',
                      data: permission,
                      params: {'uuid': $scope.uuid, 'username': permission.username, 'pems': true}
                    })
                  );
                });

                angular.forEach($scope.tempModel.permissions, function(permission){
                  if ($scope.resource.type === 'agave'){
                    promises.push(
                      $http({
                        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                        method: 'POST',
                        data: permission,
                        params: {'appId': resource.id, 'username': permission.username, 'pems': true}
                      })
                    );
                  }

                  promises.push(
                    $http({
                      url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                      method: 'POST',
                      data: $scope.mapAppPemsToMetaPems(permission),
                      params: {'uuid': $scope.uuid, 'username': permission.username, 'pems': true}
                    })
                  );
                });

                $q.all(promises).then(
                  function(response) {
                      $scope.requesting = false;
                      $uibModalInstance.close();
                  },
                  function(response) {
                      var message = '';
                      if (response.data) {
                        message = 'Error updating permissions - ' + response.data;
                      } else {
                        message = 'Error updating permissions';
                      }
                      $scope.error = message;
                      $scope.requesting = false;
                  });
              };


              $scope.cancel = function()
              {
                  $uibModalInstance.dismiss('cancel');
              };

              $scope.refresh();
          }]

        });
    };
  }]);
})(window, angular, jQuery, _);
