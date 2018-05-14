(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').controller('ApplicationTrayCtrl',
    ['$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$translate', '$state', 'Apps', 'AppsPems', 'SimpleList', 'MultipleList', 'Django', 'toastr', function($scope, $rootScope, $q, $timeout, $uibModal, $translate, $state, Apps, AppsPems, SimpleList, MultipleList, Django, toastr) {

      $scope.tabs = [];
      $scope.simpleList = new SimpleList();

      $scope.addDefaultTabs = function (query) {
        $scope.error = '';
        var self = this;
        var deferred = $q.defer();

        $scope.simpleList.getDefaultLists(query)
          .then(function(response){
            deferred.resolve(response);
          })
          .catch(function(response){
            $scope.error = $translate.instant('error_tab_get') + response.data;
            deferred.reject(response);
          });
        return deferred.promise;
      };

      $scope.addUserTabs = function(query, active){
        $scope.error = '';
        var self = this;
        var deferred = $q.defer();
        var query = {'name': $translate.instant('apps_metadata_list_name')};

        $scope.simpleList.getUserLists(query)
          .then(function(response){
            deferred.resolve(response);
          })
          .catch(function(response){
            $scope.error = $translate.instant('error_tab_get') + response.data;
            deferred.reject(response);
          });;

        return deferred.promise;
      };

      $scope.addTab = function(){
        $scope.error = '';
        $scope.requesting = true;
        var self = this;
        var deferred = $q.defer();
        var title = 'new_tray';
        var appMultipleList = new MultipleList();
        var query = {'name': $translate.instant('apps_metadata_name')};

        appMultipleList.addMultipleLists(title, query)
          .then(
            function(response){
              $scope.tabs.push({
                title: title,
                content: {},
                edit: true,
                multiple: appMultipleList,
                original: appMultipleList.lists[1],
                active: true,
                new: true
              });
              deferred.resolve(response);
              $scope.requesting = false;
            }
          );
        return deferred.promise;
      };

      $scope.editTab = function(tab){
        $scope.error = '';

        $scope.requesting = true;
        var self = this;
        var deferred = $q.defer();
        var promises = [];
        var appMultipleList = new MultipleList();
        var query = {'name': $translate.instant('apps_metadata_name')};
        var apps = tab.content;

        appMultipleList.addEditLists(query, tab.title, apps )
          .then(
            function(data){
              tab.content = {};
              tab.multiple = appMultipleList;
              tab.original = angular.copy(appMultipleList.lists[1]);
              tab.edit = true;
              deferred.resolve();
              $scope.requesting = false;
            },
            function(response){
              deferred.reject();
              $scope.error = $translate.instant('error_tab_edit');
            });

          return deferred.promise;
      };

      $scope.saveTab = function(tab, list){
        $scope.error = '';
        $scope.requesting = true;
        var query = {'name': $translate.instant('apps_metadata_list_name'), 'value.label':tab.title};
        var simpleList = new SimpleList();
        var mylist = list;
        var mytab = tab;
        simpleList.saveList(query, mytab, mylist)
          .then(
            function(data){
              tab.new = false;
              $scope.requesting = false;
            },
            function(error){
              $scope.error = $translate.instant('error_tab_edit');
            });
      };


      $scope.cancelTab = function(tab, list){
        var simpleList = tab;
        simpleList.content.selected = null;
        simpleList.content = [];
        angular.forEach(tab.original.items, function(app){
          simpleList.content.push(app);
        });
        simpleList.edit = false;
      };

      $scope.removeTab = function (event, index, tab) {
        $scope.error = '';
        event.preventDefault();
        event.stopPropagation();

        var modalInstance = $uibModal.open({
           templateUrl: '/static/designsafe/apps/applications/html/application-tray-delete.html',
           scope: $scope,
           size: 'md',
           resolve: {
             tab: function(){
               return tab;
             }
           },
           controller: [
             '$scope', '$uibModalInstance', '$translate', 'tab', function($scope, $uibModalInstance, $translate, tab) {

                $scope.tab = tab;

                $scope.deleteTab = function() {
                  $scope.requesting = true;
                  var query = {'name': $translate.instant('apps_metadata_list_name'), 'value.label': tab.title};
                  var simpleList = new SimpleList();

                  if (tab.new === true){
                    $scope.tabs.splice(index, 1);
                    $scope.requesting = false;
                    $uibModalInstance.dismiss();
                  } else {
                    simpleList.deleteList(query, tab)
                      .then(
                        function(response){
                          $scope.tabs.splice(index, 1);
                          $scope.requesting = false;
                          $uibModalInstance.dismiss();
                        },
                        function(response){
                          $scope.error = $translate.instant('error_tab_delete');
                          $scope.requesting = false;
                        }
                      );
                  }
                };

                $scope.cancel = function() {
                  $uibModalInstance.dismiss();
                };
             }
           ]
         });
     };


      $scope.getSelectedItemsIncluding = function(list, item) {
        item.selected = true;
        return list.items.filter(function(item) { return item.selected; });
      };


      $scope.onDragstart = function(list, event) {
         list.dragging = true;
      };

      $scope.onDrop = function(list, items, index) {
        angular.forEach(items, function(item) { item.selected = false; });
        list.items = list.items.slice(0, index)
                    .concat(items)
                    .concat(list.items.slice(index));
        return true;
      };

      $scope.onMoved = function(list) {
        list.items = list.items.filter(function(item) { return !item.selected; });
      };

      $scope.getHistory = function(){
        Apps;
      };

      $scope.syncApps = function() {
        $scope.requesting = true;

        // get myapps from tabs
        var myapps = {};
        _.each($scope.simpleList.lists['Public'], function(app){
          myapps[app.value.definition.id] = app.value;
        });

        _.each($scope.simpleList.lists['Private'], function(app){
          myapps[app.value.definition.id] = app.value;
        });


        // get current agave apps
        Apps.getApps()
          .then(function(response){
            // state 1:  First check if there's an app added by CLI or other "medium"
            $scope.appsCurrent = {};
            $scope.appsToSync = [];
            $scope.appsMetaMap = {};
            $scope.appsMetaPemsMap = {};

            _.each(response.data, function(app){
              $scope.appsCurrent[app.id] = app;
              if (!(app.id in myapps)){
                $scope.appsToSync.push(app);
              } else {
                if ( Date.parse($scope.appsCurrent[app.id].lastModified) !== Date.parse(myapps[app.id].definition.lastModified) ){
                  $scope.appsToSync.push(app);
                }
              }
            });
          })
          .then(function(){
            // state 2: check if there are any app definitions or permissions that need to be updated
            $scope.appsCreateMeta = [];
            $scope.appsUpdateMeta = {};
            var promises = [];
            _.each($scope.appsToSync, function(app){
              promises.push(
                Apps.getSyncMeta(app.id)
                  .then(function(response){
                    if (response.data.length === 0){
                      $scope.appsCreateMeta.push(app);
                    } else {
                      // only update non-published apps
                      if (!app.isPublic){
                        $scope.appsUpdateMeta[response.data[0].uuid] = response.data[0].value.definition.id;
                      }
                    }
                  })
              );
            });
            return $q.all(promises);
          })
          .then(function(){
            // state 3: Create metadata if needed
            var promises = [];
            _.each($scope.appsCreateMeta, function(app){
              var metadata = {};
              metadata.name = $translate.instant('apps_metadata_name');
              metadata.value = {};
              metadata.value.type = 'agave';
              metadata.value.definition = app;
              promises.push(
                Apps.createMeta(metadata)
                .then(
                  function(response){
                      $scope.appsUpdateMeta[response.data.uuid] = app.id;
                  })
              );

            });

            return $q.all(promises);
          })
          .then(function(){
            // state 4: Create maps for app meta and app meta permissions that need to be updated
            $scope.appsMeta = {};
            $scope.appsMetaPems = {};

            var promises = [];

            _.each($scope.appsUpdateMeta, function(appId, uuid){
              promises.push(
                Apps.get(appId)
                  .then(function(response){
                    $scope.appsMetaMap[uuid] = response.data;
                })
              );

              promises.push(
                Apps.getSyncPermissions(appId)
                  .then(function(response){
                    $scope.appsMetaPemsMap[uuid] = response.data;
                  })
              );
            });

            return $q.all(promises);
          })
          .then(function(){
            // state 5: Make all calls for meta and permissions updates
            var promises = [];

            _.each($scope.appsMetaMap, function(app, uuid){
              var metadata = {};
              metadata.name = $translate.instant('apps_metadata_name');
              metadata.value = {};
              metadata.value.type = 'agave';
              metadata.value.definition = app;
              //
              promises.push(
                Apps.updateMeta(metadata, uuid)
                  .then(
                    function(response){
                      toastr.success($translate.instant('apps_sync_success') + app.id);
                    }
                  )
              );
            });

            _.each($scope.appsMetaPemsMap, function(permissions, uuid){
               _.each(permissions, function(permission){
                  var agaveAppPem = {username: permission.username, permission: AppsPems.transformRwxToAgave(permission.permission)};
                  promises.push(Apps.syncPermissions(AppsPems.mapAppPemToMetaPem(agaveAppPem), uuid));
               });
            });

            return $q.all(promises);
          })
          .then(function(){
            // state 6: toaster message or refresh if needed
            if (_.isEmpty($scope.appsMetaMap) && _.isEmpty($scope.appsMetaPemsMap)){
              toastr.success($translate.instant('apps_sync_todate'));
              $scope.requesting = false;
            } else {
              $scope.refreshApps();
            }
          })
          .catch(
            function(response){
              toastr.warning($translate.instant('apps_sync_error'));
              $scope.requesting = false;
            }
          );

          $scope.appsTabs = null;
          $scope.appsCurrent = null;
          $scope.appsToSync = null;
          $scope.appsSyncedUuids = null;
          $scope.appsMetaMap = null;
          $scope.appsMetaPemsMap = null;
      };

      $scope.refreshApps = function() {
        $scope.error = '';
        $scope.requesting = true;
        $scope.tabs = [];


        $scope.addDefaultTabs({'name': $translate.instant('apps_metadata_name')})
          .then(function(){
            var deferred = $q.defer();

            $scope.addUserTabs({'name': $translate.instant('apps_metadata_list_name')})
              .then(function(response){
                deferred.resolve(response);
              });

            return deferred.promise;
          })
          .then(function(response){
            $scope.tabs.push(
              {
                title: 'Private',
                content: $scope.simpleList.lists['Private']
              }
            );

            $scope.tabs.push(
              {
                title: 'Public',
                content: $scope.simpleList.lists['Public']
              }
            );

            angular.forEach($scope.simpleList.lists, function(list, key){
              if (key !== 'Public' && key !== 'Private') {
                $scope.tabs.push({
                  title: key,
                  content: list
                });
              }
            });

            $scope.requesting = false;
          });

      };
      $scope.refreshApps();

      $scope.editApp = function(appMeta){
        $scope.edit = false;
        $scope.error = '';
        switch(appMeta.value.type){
          case 'agave':
            Apps.getPermissions(appMeta.value.definition.id)
              .then(
                function(response){
                  _.each(response.data, function(permission){
                    if (Django.user === permission.username){
                      if (permission.permission.write){
                        $scope.edit = true;
                      }
                    }
                  });

                  if ($scope.edit){
                    $state.transitionTo('applications-edit', {appId: appMeta.value.definition.id, appMeta: appMeta.value});
                  } else {
                    $scope.error = $translate.instant('error_app_edit_permissions');
                  }
                },
                function(response){
                  if (response.data) {
                    if (response.data.message){
                      $scope.error = $translate.instant('error_app_edit') + response.data.message;
                    } else {
                      $scope.error = $translate.instant('error_app_edit') + response.data;
                    }
                  } else {
                    $scope.error = $translate.instant('error_app_edit');
                  }
                }
              );
            break;
          case 'html':
              Apps.getMetaPems(appMeta.uuid)
                .then(
                  function(response){
                    _.each(response.data, function(permission){
                      if (Django.user === permission.username){
                        if (permission.permission.write){
                          $scope.edit = true;
                        }
                      }
                    });

                    if ($scope.edit){
                      $state.transitionTo('applications-edit', {appId: appMeta.value.definition.id, appMeta: appMeta.value});
                    } else {
                      $scope.error = $translate.instant('error_app_edit_permissions');
                    }
                  },
                  function(response){
                    $scope.error = $translate.instant('error_app_permissions');
                  }
                );
            break;
        }


      };

      $scope.editPermissions = function(appMeta){
        AppsPems.editPermissions(appMeta.value);
      };

      $scope.confirmAction = function(appMeta, action){
        $scope.error = '';
        var modalInstance = $uibModal.open({
          templateUrl: '/static/designsafe/apps/applications/html/application-confirm.html',
          scope: $scope,
          size: 'sm',
          resolve: {
            appMeta: function(){
              return appMeta;
            },
            action: function(){
              return action;
            }
          },
          controller: [
            '$scope', '$uibModalInstance', '$translate', 'appMeta', 'action', function($scope, $uibModalInstance, $translate, appMeta, action) {
              $scope.action = action;

              $scope.appMeta = appMeta;

              $scope.cancel = function() {
                $uibModalInstance.dismiss();
              };

              $scope.confirm = function(){
                  $scope.requesting = true;
                  if (appMeta.value.type === 'agave'){
                    switch(action){
                      case 'publish':
                          var body = {'action': action};
                          Apps.manageApp(appMeta.value.definition.id, body)
                          .then(
                            function(response){
                              var available = response.data.available;

                              var metadata = {};
                              metadata.name = $translate.instant('apps_metadata_name');
                              metadata.value = {};
                              metadata.value.type = 'agave';
                              metadata.value.definition = response.data;

                              // create meta
                              Apps.createMeta(metadata)
                                .then(
                                  function(response){
                                      // make meta world readable
                                      var body = {};
                                      body.username = 'world';
                                      body.permission = 'READ';
                                      Apps.updateMetaPermissions(body, response.data.uuid)
                                        .then(
                                          function(response){
                                            $uibModalInstance.dismiss();
                                            // $scope.parentUibModalInstance.dismiss();
                                            // $scope.parentRefresh();
                                          },
                                          function(response){
                                            if (response.data) {
                                              if (response.data.message){
                                                $scope.error = $translate.instant('error_app_publish') + response.data.message;
                                              } else {
                                                $scope.error = $translate.instant('error_app_publish') + response.data;
                                              }
                                            } else {
                                              $scope.error = $translate.instant('error_app_publish');
                                            }
                                          }
                                        );
                                  },
                                  function(response){
                                    $scope.requesting = false;
                                    $scope.error = $translate.instant('error_app_publish') + response.data;
                                  }
                                );
                            },
                            function(response){
                              $scope.requesting = false;
                              if (response.data) {
                                if (response.data.message){
                                  $scope.error = $translate.instant('error_app_publish') + response.data.message;
                                } else {
                                  $scope.error = $translate.instant('error_app_publish') + response.data;
                                }
                              } else {
                                $scope.error = $translate.instant('error_app_publish');
                              }
                            }
                          );
                        break;
                      case 'disable':
                      case 'enable':
                        var body = {'action': action};
                        Apps.manageApp(appMeta.value.definition.id, body)
                          .then(
                            function(response){
                              var metadata = {};
                              metadata.name = $translate.instant('apps_metadata_name');
                              metadata.value = {};
                              metadata.value.type = 'agave';
                              metadata.value.definition = appMeta.value.definition;
                              metadata.value.definition.available = response.data.available;

                              Apps.updateMeta(metadata, appMeta.uuid)
                                .then(
                                  function(response){
                                    $scope.requesting = false;
                                    $uibModalInstance.dismiss();
                                    $scope.refreshApps();
                                  },
                                  function(response){
                                    $scope.requesting = false;
                                    $scope.error = $translate.instant('error_app_update') + response.data;
                                  }
                                );


                            },
                            function(response){
                              $scope.requesting = false;
                              $scope.error = $translate.instant('error_app_update') + response.data;
                            }
                          );

                        break;
                      case 'delete':
                        if (appMeta.value.definition.isPublic){
                          if (Django.user === $translate.instant('admin_username')){
                            Apps.deleteApp(appMeta.value.definition.id)
                            .then(
                              function(response){
                                $scope.requesting = false;
                              },
                              function(response){
                                // silence error response until this gets resolved: https://agaveapi.atlassian.net/browse/AD-655
                                // $scope.requesting = false;
                                // if (response.data) {
                                //   if (response.data.message){
                                //     $scope.error = $translate.instant('error_app_delete') + response.data.message;
                                //   } else {
                                //     $scope.error = $translate.instant('error_app_delete') + response.data;
                                //   }
                                // } else {
                                //   $scope.error = $translate.instant('error_app_delete');
                                // }
                              }
                            );

                            // placing this here for now until this gets resolved: https://agaveapi.atlassian.net/browse/AD-655
                            Apps.deleteMeta(appMeta.uuid)
                              .then(
                                function(response){
                                  $scope.requesting = false;
                                  $uibModalInstance.dismiss();
                                  $scope.refreshApps();
                                },
                                function(response){
                                  $scope.requesting = false;
                                  if (response.data) {
                                    if (response.data.message){
                                      $scope.error = $translate.instant('error_app_delete') + response.data.message;
                                    } else {
                                      $scope.error = $translate.instant('error_app_delete') + response.data;
                                    }
                                  } else {
                                    $scope.error = $translate.instant('error_app_delete');
                                  }
                                }
                              );
                          } else {
                            $scope.error = $translate.instant('error_app_delete_permissions');
                            $scope.requesting = false;
                          }
                        } else {
                          Apps.deleteApp(appMeta.value.definition.id)
                            .then(
                              function(response){
                                $scope.requesting = false;
                              },
                              function(response){
                                // silence error response until this gets resolved: https://agaveapi.atlassian.net/browse/AD-655
                                // $scope.requesting = false;
                                // if (response.data) {
                                //   if (response.data.message){
                                //     $scope.error = $translate.instant('error_app_delete') + response.data.message;
                                //   } else {
                                //     $scope.error = $translate.instant('error_app_delete') + response.data;
                                //   }
                                // } else {
                                //   $scope.error = $translate.instant('error_app_delete');
                                // }
                              }
                            );

                          // placing this here for now until this gets resolved: https://agaveapi.atlassian.net/browse/AD-655
                          Apps.deleteMeta(appMeta.uuid)
                            .then(
                              function(response){
                                $scope.requesting = false;
                                $uibModalInstance.dismiss();
                                $scope.refreshApps();
                              },
                              function(response){
                                $scope.requesting = false;
                                if (response.data) {
                                  if (response.data.message){
                                    $scope.error = $translate.instant('error_app_delete') + response.data.message;
                                  } else {
                                    $scope.error = $translate.instant('error_app_delete') + response.data;
                                  }
                                } else {
                                  $scope.error = $translate.instant('error_app_delete');
                                }
                              }
                            );
                        }


                        break;
                    } // end switch
                  } // end if agave

                  else {
                    // get and update app meta
                    Apps.getMeta(appMeta.value.definition.id)
                      .then(
                        function(response){
                          switch(action){
                            case 'delete':
                              Apps.deleteMeta(response.data[0].uuid)
                                .then(
                                    function(response){
                                      $scope.requesting = false;
                                      $uibModalInstance.dismiss();
                                      $scope.refreshApps();
                                    },
                                    function(response){
                                      $scope.requesting = false;
                                      if (response.data) {
                                        if (response.data.message){
                                          $scope.error = $translate.instant('error_app_update') + response.data.message;
                                        } else {
                                          $scope.error = $translate.instant('error_app_update') + response.data;
                                        }
                                      } else {
                                        $scope.error = $translate.instant('error_app_update');
                                      }
                                    });
                              break;
                            case 'private':
                            case 'publish':
                              if (Django.user === 'ds_admin'){
                                var metadata = {};
                                metadata.uuid = response.data[0].uuid;
                                metadata.name = response.data[0].name;
                                metadata.value = response.data[0].value;
                                metadata.value.definition.isPublic = (action === 'publish');
                                metadata.value.definition.available = response.data[0].value.definition.available;

                                Apps.updateMeta(metadata, appMeta.uuid)
                                  .then(
                                    function(response){
                                      // make meta world readable, or remove world permissions if making private
                                      var body = {};
                                      body.username = 'world';
                                      body.permission = (action === 'publish') ? 'READ' : 'NONE';
                                      Apps.updateMetaPermissions(body, metadata.uuid)
                                        .then(
                                          function(response){
                                            $scope.requesting = false;
                                            $uibModalInstance.dismiss();
                                            $scope.refreshApps();
                                          },
                                          function(response){
                                            $scope.requesting = false;
                                            if (response.data) {
                                              if (response.data.message){
                                                $scope.error = $translate.instant('error_app_update') + response.data.message;
                                              } else {
                                                $scope.error = $translate.instant('error_app_update') + response.data;
                                              }
                                            } else {
                                              $scope.error = $translate.instant('error_app_update');
                                            }
                                          }
                                        );
                                    },
                                    function(response){
                                      $scope.requesting = false;
                                      if (response.data) {
                                        if (response.data.message){
                                          $scope.error = $translate.instant('error_app_update') + response.data.message;
                                        } else {
                                          $scope.error = $translate.instant('error_app_update') + response.data;
                                        }
                                      } else {
                                        $scope.error = $translate.instant('error_app_update');
                                      }
                                    }
                                  );
                              } else {
                                $scope.requesting = false;
                                if (response.data) {
                                  if (response.data.message){
                                    $scope.error = $translate.instant('error_app_publish_permission') + response.data.message;
                                  } else {
                                    $scope.error = $translate.instant('error_app_publish_permission') + response.data;
                                  }
                                } else {
                                  $scope.error = $translate.instant('error_app_publish_permission');
                                }
                              }

                              break;
                            case 'disable':
                            case 'enable':
                              var metadata = {};
                              metadata.uuid = response.data[0].uuid;
                              metadata.name = response.data[0].name;
                              metadata.value = response.data[0].value;
                              metadata.value.definition.available = (action === "enable");

                              Apps.updateMeta(metadata, appMeta.uuid)
                                .then(
                                function (response) {
                                  $scope.requesting = false;
                                  $uibModalInstance.dismiss();
                                  $scope.refreshApps();
                                },
                                function (response) {
                                  $scope.requesting = false;
                                  if (response.data) {
                                    if (response.data.message) {
                                      $scope.error = $translate.instant('error_app_update') + response.data.message;
                                    } else {
                                      $scope.error = $translate.instant('error_app_update') + response.data;
                                    }
                                  } else {
                                    $scope.error = $translate.instant('error_app_update');
                                  }
                                }
                                );

                              break;
                            default:
                              var metadata = {};
                              // metadata.uuid = response.data[0].uuid;
                              metadata.name = response.data[0].name;
                              metadata.value = response.data[0].value;
                              metadata.value.definition.isPublic = response.data[0].value.definition.isPublic;
                              metadata.value.definition.available = response.data[0].value.definition.available;

                              if (action === 'disable'){
                                metadata.value.definition.available = false;
                              } else if (action === 'enable'){
                                metadata.value.definition.available = true;
                              }

                              Apps.updateMeta(metadata, response.data[0].uuid)
                                .then(
                                  function(response){
                                    $scope.requesting = false;
                                    $uibModalInstance.dismiss();
                                    $scope.refreshApps();
                                    // $scope.parentUibModalInstance.dismiss();
                                    // $scope.parentRefresh();
                                  },
                                  function(response){
                                    $scope.requesting = false;
                                    if (response.data) {
                                      if (response.data.message){
                                        $scope.error = $translate.instant('error_app_update') + response.data.message;
                                      } else {
                                        $scope.error = $translate.instant('error_app_update') + response.data;
                                      }
                                    } else {
                                      $scope.error = $translate.instant('error_app_update');
                                    }
                                  }
                                );
                              break;
                          }


                        },
                        function(response){
                          $scope.requesting = false;
                          $scope.error = $translate.instant('error_app_update') + response.data;
                        }
                      );
                  }
              };
            }]
        });
      };

      $scope.cloneApp = function(app){
        $scope.error = '';
        $scope.clone = false;

        // Check system roles for cloning -- TODO: Create simpler agave call for single user's pems
        var execSystem = $translate.instant('execution_default');
        Apps.getSystemRoles(execSystem)
          .then(
            function(response){
              for(var i = 0; i < response.data.length; i++){
                if (response.data[i].username === Django.user){
                  if (response.data[i].role === 'ADMIN' || response.data[i].role === 'PUBLISHER' || response.data[i].role === 'OWNER'){
                    $scope.clone = true;
                    break;
                  }
                }
              };

              if ($scope.clone){
                  Apps.getSystems()
                    .then(
                      function(response){
                        var storageSystemsTitleMap = [];
                        var executionSystemsTitleMap = [];

                        if (Django.user !== $translate.instant('admin_username')){
                          executionSystemsTitleMap.push({"value": $translate.instant('execution_default'), "name": $translate.instant('execution_default')});
                          _.each(response.data, function(system){
                            if (system.type === 'STORAGE') {
                              storageSystemsTitleMap.push({"value": system.id, "name": system.id});
                            }
                          });
                        } else {
                          _.each(response.data, function(system){
                            if (system.type === 'STORAGE') {
                              storageSystemsTitleMap.push({"value": system.id, "name": system.id});
                            } else {
                              executionSystemsTitleMap.push({"value": system.id, "name": system.id});
                            }
                          });
                        }

                        var modalInstance = $uibModal.open({
                          templateUrl: '/static/designsafe/apps/applications/html/application-clone.html',
                          scope: $scope,
                          size: 'md',
                          controller: [
                            '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                              $scope.app = app;

                              $scope.schema = {
                                "type": "object",
                                "properties": {
                                  "name": {
                                    "type": "string",
                                    "description": "Name given to the clone of the existing app. Defaults to the current app name and the authenticated user's username appended with a dash",
                                    "title": "Name",
                                  },
                                  "version": {
                                      "type": "string",
                                      "description": "Version given to the clone of the existing app. Defaults to the current app's version number. It should be in #.#.# format",
                                      "title": "Version",
                                      "validator": "\\d+(\\.\\d+)+",
                                      "minLength": 3,
                                      "maxLength": 16
                                  },
                                  "deploymentSystem":{
                                    "type": "string",
                                    "description": "Deployment path for the application assets on the cloned app's storage system. This only applies to clone public apps.",
                                    "title": "Deployment System",
                                  },
                                  "executionSystem":{
                                    "type": "string",
                                    "description": "Execution system for the new app. Defaults to the current app's execution system",
                                    "title": "Execution System",
                                  },
                                  "deploymentPath":{
                                    "type": "string"
                                  }
                                }
                              };

                              $scope.form = [
                                {
                                  "key": "name",
                                },
                                {
                                  "key": "version",
                                },
                                {
                                  "key": "deploymentSystem",
                                  "type": "select",
                                  "titleMap": storageSystemsTitleMap
                                },
                                {
                                  "key": "executionSystem",
                                  "type": "select",
                                  "titleMap": executionSystemsTitleMap
                                }
                              ];

                              $scope.model= {};

                              $scope.cancel = function() {
                                $uibModalInstance.dismiss();
                              };

                              $scope.submit = function(){
                                $scope.requesting = true;
                                $scope.error = '';
                                if ($scope.myForm.$valid){
                                  var body = {'action': 'clone'};
                                  angular.extend(body, $scope.model);

                                  Apps.manageApp($scope.app.value.definition.id, body)
                                    .then(
                                      function(response){
                                        $scope.requesting = false;
                                        $uibModalInstance.dismiss();
                                        $scope.syncApps();
                                      },
                                      function(response){
                                        $scope.requesting = false;
                                        if (response.data) {
                                          if (response.data.message){
                                            $scope.error = $translate.instant('error_app_clone') + response.data.message;
                                          } else {
                                            $scope.error = $translate.instant('error_app_clone') + response.data;
                                          }
                                        } else {
                                          $scope.error = $translate.instant('error_app_clone');
                                        }
                                      }
                                    );


                                }

                            };
                          }]
                        });
                      },
                      function(response){
                        $scope.error = $translate.instant('error_app_clone');
                        $scope.requesting = false;
                      }
                    );
              } else {
                  var modalInstance = $uibModal.open({
                  templateUrl: '/static/designsafe/apps/applications/html/application-clone.html',
                  scope: $scope,
                  size: 'md',
                  controller: [
                    '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                      $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                      };
                    }
                  ]
                });
              }
            },
            function(response){
              $scope.requesting = false;
            }
          );



      };

      $scope.run = function(app){
        $rootScope.$emit('launch-app', app);
      };

      $scope.getAppDetails = function(app) {
        $scope.app = '';
        $scope.error = '';

        var modalInstance = $uibModal.open({
            templateUrl: '/static/designsafe/apps/applications/html/application-details.html',
            scope: $scope,
            size: 'md',
            controller: [
              '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                $scope.app = app;

                $scope.cancel = function() {
                  $uibModalInstance.dismiss();
                };

                $scope.getMeta = function(){
                  // Find appCategory if it exists in tags
                  if (app.value.definition.hasOwnProperty("tags") && app.value.definition.tags.filter(s => s.includes('appCategory')) !== undefined && app.value.definition.tags.filter(s => s.includes('appCategory')).length != 0) {
                    app.value.definition.appCategory = app.value.definition.tags.filter(s => s.includes('appCategory'))[0].split(':')[1];
                  }
                  $scope.appMeta = app;
                };

                $scope.getMeta();
              }
            ]
          });
      };
    }]);

})(window, angular, jQuery, _);
