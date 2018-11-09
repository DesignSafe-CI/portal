export function applicationTrayCtrl(window, angular, $, _) {
    'ngInject';
    angular.module('designsafe').controller('ApplicationTrayCtrl',
        ['$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$translate', '$state', 'Apps', 'AppsPems', 'SimpleList', 'MultipleList', 'Django', 'toastr', function($scope, $rootScope, $q, $timeout, $uibModal, $translate, $state, Apps, AppsPems, SimpleList, MultipleList, Django, toastr) {
            $scope.tabs = [];
            $scope.simpleList = new SimpleList();

            $scope.addDefaultTabs = function(query) {
                $scope.error = '';
                let deferred = $q.defer();

                $scope.simpleList.getDefaultLists(query)
                    .then(function(response) {
                        deferred.resolve(response);
                    })
                    .catch(function(response) {
                        $scope.error = $translate.instant('error_tab_get') + response.data;
                        deferred.reject(response);
                    });
                return deferred.promise;
            };


            $scope.getSelectedItemsIncluding = function(list, item) {
                item.selected = true;
                return list.items.filter(item => {
                    return item.selected;
                });
            };


            $scope.onDragstart = function(list, event) {
                list.dragging = true;
            };

            $scope.onDrop = function(list, items, index) {
                angular.forEach(items, function(item) {
                    item.selected = false;
                });
                list.items = list.items.slice(0, index)
                    .concat(items)
                    .concat(list.items.slice(index));
                return true;
            };

            $scope.onMoved = function(list) {
                list.items = list.items.filter(function(item) {
                    return !item.selected;
                });
            };

            $scope.getHistory = function() {
                Apps;
            };

            $scope.syncApps = function() {
                $scope.requesting = true;

                // get myapps from tabs
                let myapps = {};
                _.each($scope.simpleList.lists['Public'], function(app) {
                    myapps[app.value.definition.id] = app.value;
                });

                _.each($scope.simpleList.lists['Private'], function(app) {
                    myapps[app.value.definition.id] = app.value;
                });


                // get current agave apps
                Apps.getApps()
                    .then(function(response) {
                        // state 1:  First check if there's an app added by CLI or other 'medium'
                        $scope.appsCurrent = {};
                        $scope.appsToSync = [];
                        $scope.appsMetaMap = {};
                        $scope.appsMetaPemsMap = {};

                        _.each(response.data, function(app) {
                            $scope.appsCurrent[app.id] = app;
                            if (!(app.id in myapps)) {
                                $scope.appsToSync.push(app);
                            } else {
                                if (Date.parse($scope.appsCurrent[app.id].lastModified) !== Date.parse(myapps[app.id].definition.lastModified)) {
                                    $scope.appsToSync.push(app);
                                }
                            }
                        });
                    })
                    .then(function() {
                        // state 2: check if there are any app definitions or permissions that need to be updated
                        $scope.appsCreateMeta = [];
                        $scope.appsUpdateMeta = {};
                        let promises = [];
                        _.each($scope.appsToSync, function(app) {
                            promises.push(
                                Apps.getSyncMeta(app.id)
                                    .then(function(response) {
                                        if (response.data.length === 0) {
                                            $scope.appsCreateMeta.push(app);
                                        } else {
                                            // only update non-published apps
                                            if (!app.isPublic) {
                                                $scope.appsUpdateMeta[response.data[0].uuid] = response.data[0].value.definition.id;
                                            }
                                        }
                                    })
                            );
                        });
                        return $q.all(promises);
                    })
                    .then(function() {
                        // state 3: Create metadata if needed
                        let promises = [];
                        _.each($scope.appsCreateMeta, function(app) {
                            let metadata = {};
                            metadata.name = $translate.instant('apps_metadata_name');
                            metadata.value = {};
                            metadata.value.type = 'agave';
                            metadata.value.definition = app;
                            promises.push(
                                Apps.createMeta(metadata)
                                    .then(
                                        function(response) {
                                            $scope.appsUpdateMeta[response.data.uuid] = app.id;
                                        })
                            );
                        });

                        return $q.all(promises);
                    })
                    .then(function() {
                        // state 4: Create maps for app meta and app meta permissions that need to be updated
                        $scope.appsMeta = {};
                        $scope.appsMetaPems = {};

                        let promises = [];

                        _.each($scope.appsUpdateMeta, function(appId, uuid) {
                            promises.push(
                                Apps.get(appId)
                                    .then(function(response) {
                                        $scope.appsMetaMap[uuid] = response.data;
                                    })
                            );

                            promises.push(
                                Apps.getSyncPermissions(appId)
                                    .then(function(response) {
                                        $scope.appsMetaPemsMap[uuid] = response.data;
                                    })
                            );
                        });

                        return $q.all(promises);
                    })
                    .then(function() {
                        // state 5: Make all calls for meta and permissions updates
                        let promises = [];

                        _.each($scope.appsMetaMap, function(app, uuid) {
                            let metadata = {};
                            metadata.name = $translate.instant('apps_metadata_name');
                            metadata.value = {};
                            metadata.value.type = 'agave';
                            metadata.value.definition = app;
                            //
                            promises.push(
                                Apps.updateMeta(metadata, uuid)
                                    .then(
                                        function(response) {
                                            toastr.success($translate.instant('apps_sync_success') + app.id);
                                        }
                                    )
                            );
                        });

                        _.each($scope.appsMetaPemsMap, function(permissions, uuid) {
                            _.each(permissions, function(permission) {
                                let agaveAppPem = { username: permission.username, permission: AppsPems.transformRwxToAgave(permission.permission) };
                                promises.push(Apps.syncPermissions(AppsPems.mapAppPemToMetaPem(agaveAppPem), uuid));
                            });
                        });

                        return $q.all(promises);
                    })
                    .then(function() {
                        // state 6: toaster message or refresh if needed
                        if (_.isEmpty($scope.appsMetaMap) && _.isEmpty($scope.appsMetaPemsMap)) {
                            toastr.success($translate.instant('apps_sync_todate'));
                            $scope.requesting = false;
                        } else {
                            $scope.refreshApps();
                        }
                    })
                    .catch(
                        function(response) {
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


                $scope.addDefaultTabs({ name: $translate.instant('apps_metadata_name') })
                    .then(function(response) {
                        $scope.tabs.push(
                            {
                                title: 'Private',
                                content: $scope.simpleList.lists['Private'],
                            }
                        );

                        $scope.tabs.push(
                            {
                                title: 'Public',
                                content: $scope.simpleList.lists['Public'],
                            }
                        );

                        angular.forEach($scope.simpleList.lists, function(list, key) {
                            if (key !== 'Public' && key !== 'Private') {
                                $scope.tabs.push({
                                    title: key,
                                    content: list,
                                });
                            }
                        });

                        $scope.requesting = false;
                    });
            };
            $scope.refreshApps();

            $scope.editApp = function(appMeta) {
                $scope.edit = false;
                $scope.error = '';
                switch (appMeta.value.type) {
                    case 'agave':
                        Apps.getPermissions(appMeta.value.definition.id)
                            .then(
                                function(response) {
                                    _.each(response.data, function(permission) {
                                        if (Django.user === permission.username) {
                                            if (permission.permission.write) {
                                                $scope.edit = true;
                                            }
                                        }
                                    });

                                    if ($scope.edit) {
                                        $state.transitionTo('applications-edit', { appId: appMeta.value.definition.id, appMeta: appMeta.value });
                                    } else {
                                        $scope.error = $translate.instant('error_app_edit_permissions');
                                    }
                                },
                                function(response) {
                                    if (response.data) {
                                        if (response.data.message) {
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
                                function(response) {
                                    _.each(response.data, function(permission) {
                                        if (Django.user === permission.username) {
                                            if (permission.permission.write) {
                                                $scope.edit = true;
                                            }
                                        }
                                    });

                                    if ($scope.edit) {
                                        $state.transitionTo('applications-edit', { appId: appMeta.value.definition.id, appMeta: appMeta.value });
                                    } else {
                                        $scope.error = $translate.instant('error_app_edit_permissions');
                                    }
                                },
                                function(response) {
                                    $scope.error = $translate.instant('error_app_permissions');
                                }
                            );
                        break;
                }
            };

            $scope.editPermissions = function(appMeta) {
                AppsPems.editPermissions(appMeta.value);
            };

            $scope.confirmAction = function(appMeta, action) {
                $scope.error = '';
                let modalInstance = $uibModal.open({
                    template: require('../html/application-confirm.html'),
                    scope: $scope,
                    size: 'sm',
                    resolve: {
                        appMeta: function() {
                            return appMeta;
                        },
                        action: function() {
                            return action;
                        },
                    },
                    controller: [
                        '$scope', '$uibModalInstance', '$translate', 'appMeta', 'action', function($scope, $uibModalInstance, $translate, appMeta, action) {
                            $scope.action = action;

                            $scope.appMeta = appMeta;

                            $scope.cancel = function() {
                                $uibModalInstance.dismiss();
                            };

                            $scope.confirm = function() {
                                $scope.requesting = true;
                                if (appMeta.value.type === 'agave') {
                                    let body;
                                    switch (action) {
                                        case 'publish':
                                            body = { action: action };
                                            Apps.manageApp(appMeta.value.definition.id, body)
                                                .then(
                                                    function(response) {
                                                        let metadata = {};
                                                        metadata.name = $translate.instant('apps_metadata_name');
                                                        metadata.value = {};
                                                        metadata.value.type = 'agave';
                                                        metadata.value.definition = response.data;

                                                        // create meta
                                                        Apps.createMeta(metadata)
                                                            .then(
                                                                function(response) {
                                                                    // make meta world readable
                                                                    body = {};
                                                                    body.username = 'world';
                                                                    body.permission = 'READ';
                                                                    Apps.updateMetaPermissions(body, response.data.uuid)
                                                                        .then(
                                                                            function(response) {
                                                                                $uibModalInstance.dismiss();
                                                                                $scope.refreshApps();
                                                                            },
                                                                            function(response) {
                                                                                if (response.data) {
                                                                                    if (response.data.message) {
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
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $scope.error = $translate.instant('error_app_publish') + response.data;
                                                                }
                                                            );
                                                    },
                                                    function(response) {
                                                        $scope.requesting = false;
                                                        if (response.data) {
                                                            if (response.data.message) {
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
                                            body = { action: action };
                                            Apps.manageApp(appMeta.value.definition.id, body)
                                                .then(
                                                    function(response) {
                                                        let metadata = {};
                                                        metadata.name = $translate.instant('apps_metadata_name');
                                                        metadata.value = {};
                                                        metadata.value.type = 'agave';
                                                        metadata.value.definition = appMeta.value.definition;
                                                        metadata.value.definition.available = response.data.available;

                                                        Apps.updateMeta(metadata, appMeta.uuid)
                                                            .then(
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $uibModalInstance.dismiss();
                                                                    $scope.refreshApps();
                                                                },
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $scope.error = $translate.instant('error_app_update') + response.data;
                                                                }
                                                            );
                                                    },
                                                    function(response) {
                                                        $scope.requesting = false;
                                                        $scope.error = $translate.instant('error_app_update') + response.data;
                                                    }
                                                );

                                            break;
                                        case 'delete':
                                            if (appMeta.value.definition.isPublic) {
                                                if (Django.user === $translate.instant('admin_username')) {
                                                    Apps.deleteApp(appMeta.value.definition.id)
                                                        .then(
                                                            function(response) {
                                                                $scope.requesting = false;
                                                            },
                                                            function(response) {
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
                                                            function(response) {
                                                                $scope.requesting = false;
                                                                $uibModalInstance.dismiss();
                                                                $scope.refreshApps();
                                                            },
                                                            function(response) {
                                                                $scope.requesting = false;
                                                                if (response.data) {
                                                                    if (response.data.message) {
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
                                                        function(response) {
                                                            $scope.requesting = false;
                                                        },
                                                        function(response) {
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
                                                        function(response) {
                                                            $scope.requesting = false;
                                                            $uibModalInstance.dismiss();
                                                            $scope.refreshApps();
                                                        },
                                                        function(response) {
                                                            $scope.requesting = false;
                                                            if (response.data) {
                                                                if (response.data.message) {
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
                                // end if agave
                                } else {
                                    // get and update app meta
                                    Apps.getMeta(appMeta.value.definition.id)
                                        .then(
                                            function(response) {
                                                let metadata;
                                                switch (action) {
                                                    case 'delete':
                                                        Apps.deleteMeta(response.data[0].uuid)
                                                            .then(
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $uibModalInstance.dismiss();
                                                                    $scope.refreshApps();
                                                                },
                                                                function(response) {
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
                                                                });
                                                        break;
                                                    case 'private':
                                                    case 'publish':
                                                        if (Django.user === 'ds_admin') {
                                                            metadata = {};
                                                            metadata.uuid = response.data[0].uuid;
                                                            metadata.name = response.data[0].name;
                                                            metadata.value = response.data[0].value;
                                                            metadata.value.definition.isPublic = (action === 'publish');
                                                            metadata.value.definition.available = response.data[0].value.definition.available;

                                                            Apps.updateMeta(metadata, appMeta.uuid)
                                                                .then(
                                                                    function(response) {
                                                                        // make meta world readable, or remove world permissions if making private
                                                                        let body = {};
                                                                        body.username = 'world';
                                                                        body.permission = (action === 'publish') ? 'READ' : 'NONE';
                                                                        Apps.updateMetaPermissions(body, metadata.uuid)
                                                                            .then(
                                                                                function(response) {
                                                                                    $scope.requesting = false;
                                                                                    $uibModalInstance.dismiss();
                                                                                    $scope.refreshApps();
                                                                                },
                                                                                function(response) {
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
                                                                    },
                                                                    function(response) {
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
                                                        } else {
                                                            $scope.requesting = false;
                                                            if (response.data) {
                                                                if (response.data.message) {
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
                                                        metadata = {};
                                                        metadata.uuid = response.data[0].uuid;
                                                        metadata.name = response.data[0].name;
                                                        metadata.value = response.data[0].value;
                                                        metadata.value.definition.available = (action === 'enable');

                                                        Apps.updateMeta(metadata, appMeta.uuid)
                                                            .then(
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $uibModalInstance.dismiss();
                                                                    $scope.refreshApps();
                                                                },
                                                                function(response) {
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
                                                        metadata = {};
                                                        // metadata.uuid = response.data[0].uuid;
                                                        metadata.name = response.data[0].name;
                                                        metadata.value = response.data[0].value;
                                                        metadata.value.definition.isPublic = response.data[0].value.definition.isPublic;
                                                        metadata.value.definition.available = response.data[0].value.definition.available;

                                                        if (action === 'disable') {
                                                            metadata.value.definition.available = false;
                                                        } else if (action === 'enable') {
                                                            metadata.value.definition.available = true;
                                                        }

                                                        Apps.updateMeta(metadata, response.data[0].uuid)
                                                            .then(
                                                                function(response) {
                                                                    $scope.requesting = false;
                                                                    $uibModalInstance.dismiss();
                                                                    $scope.refreshApps();
                                                                    // $scope.parentUibModalInstance.dismiss();
                                                                    // $scope.parentRefresh();
                                                                },
                                                                function(response) {
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
                                                }
                                            },
                                            function(response) {
                                                $scope.requesting = false;
                                                $scope.error = $translate.instant('error_app_update') + response.data;
                                            }
                                        );
                                }
                            };
                        }],
                });
            };

            $scope.cloneApp = function(app) {
                $scope.error = '';
                $scope.clone = false;

                // Check system roles for cloning -- TODO: Create simpler agave call for single user's pems
                let execSystem = $translate.instant('execution_default');
                Apps.getRoleForUser(execSystem)
                    .then(
                        function(response) {
                            if (response.data.role === 'ADMIN' || response.data.role === 'PUBLISHER' || response.data.role === 'OWNER') {
                                $scope.clone = true;
                            }

                            if ($scope.clone) {
                                Apps.getSystems()
                                    .then(
                                        function(response) {
                                            let storageSystemsTitleMap = [],
                                                executionSystemsTitleMap = [];

                                            if (Django.user !== $translate.instant('admin_username')) {
                                                executionSystemsTitleMap.push({ value: $translate.instant('execution_default'), name: $translate.instant('execution_default') });
                                                _.each(response.data, function(system) {
                                                    if (system.type === 'STORAGE') {
                                                        storageSystemsTitleMap.push({ value: system.id, name: system.id });
                                                    }
                                                });
                                            } else {
                                                _.each(response.data, function(system) {
                                                    if (system.type === 'STORAGE') {
                                                        storageSystemsTitleMap.push({ value: system.id, name: system.id });
                                                    } else {
                                                        executionSystemsTitleMap.push({ value: system.id, name: system.id });
                                                    }
                                                });
                                            }

                                            let modalInstance = $uibModal.open({
                                                template: require('../html/application-clone.html'),
                                                scope: $scope,
                                                size: 'md',
                                                controller: [
                                                    '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                                                        $scope.app = app;

                                                        $scope.schema = {
                                                            type: 'object',
                                                            properties: {
                                                                name: {
                                                                    type: 'string',
                                                                    description: "Name given to the clone of the existing app. Defaults to the current app name and the authenticated user's username appended with a dash",
                                                                    title: 'Name',
                                                                },
                                                                version: {
                                                                    type: 'string',
                                                                    description: "Version given to the clone of the existing app. Defaults to the current app's version number. It should be in #.#.# format",
                                                                    title: 'Version',
                                                                    validator: '\\d+(\\.\\d+)+',
                                                                    minLength: 3,
                                                                    maxLength: 16,
                                                                },
                                                                deploymentSystem: {
                                                                    type: 'string',
                                                                    description: "Deployment path for the application assets on the cloned app's storage system. This only applies to clone public apps.",
                                                                    title: 'Deployment System',
                                                                },
                                                                executionSystem: {
                                                                    type: 'string',
                                                                    description: "Execution system for the new app. Defaults to the current app's execution system",
                                                                    title: 'Execution System',
                                                                },
                                                                deploymentPath: {
                                                                    type: 'string',
                                                                },
                                                            },
                                                        };

                                                        $scope.form = [
                                                            {
                                                                key: 'name',
                                                            },
                                                            {
                                                                key: 'version',
                                                            },
                                                            {
                                                                key: 'deploymentSystem',
                                                                type: 'select',
                                                                titleMap: storageSystemsTitleMap,
                                                            },
                                                            {
                                                                key: 'executionSystem',
                                                                type: 'select',
                                                                titleMap: executionSystemsTitleMap,
                                                            },
                                                        ];

                                                        $scope.model = {};

                                                        $scope.cancel = function() {
                                                            $uibModalInstance.dismiss();
                                                        };

                                                        $scope.submit = function() {
                                                            $scope.requesting = true;
                                                            $scope.error = '';
                                                            if ($scope.myForm.$valid) {
                                                                let body = { action: 'clone' };
                                                                angular.extend(body, $scope.model);

                                                                Apps.manageApp($scope.app.value.definition.id, body)
                                                                    .then(
                                                                        function(response) {
                                                                            $scope.requesting = false;
                                                                            $uibModalInstance.dismiss();
                                                                            $scope.syncApps();
                                                                        },
                                                                        function(response) {
                                                                            $scope.requesting = false;
                                                                            if (response.data) {
                                                                                if (response.data.message) {
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
                                                    }],
                                            });
                                        },
                                        function(response) {
                                            $scope.error = $translate.instant('error_app_clone');
                                            $scope.requesting = false;
                                        }
                                    );
                            } else {
                                let modalInstance = $uibModal.open({
                                    template: require('../html/application-clone.html'),
                                    scope: $scope,
                                    size: 'md',
                                    controller: [
                                        '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                                            $scope.cancel = function() {
                                                $uibModalInstance.dismiss();
                                            };
                                        },
                                    ],
                                });
                            }
                        },
                        function(response) {
                            $scope.requesting = false;
                        }
                    );
            };

            $scope.run = function(app) {
                $rootScope.$emit('launch-app', app);
            };

            $scope.getAppDetails = function(app) {
                $scope.app = '';
                $scope.error = '';

                let modalInstance = $uibModal.open({
                    template: require('../html/application-details.html'),
                    scope: $scope,
                    size: 'md',
                    controller: [
                        '$scope', '$uibModalInstance', '$translate', function($scope, $uibModalInstance, $translate) {
                            $scope.app = app;

                            $scope.cancel = function() {
                                $uibModalInstance.dismiss();
                            };

                            $scope.getMeta = function() {
                                // Find appCategory if it exists in tags
                                if ($scope.simpleList.tagIncludesParam(app.value.definition, 'appCategory')) {
                                    app.value.definition.appCategory = app.value.definition.tags.filter(s => s.includes('appCategory'))[0].split(':')[1];
                                }
                                // Find appIcon if it exists in tags
                                if ($scope.simpleList.tagIncludesParam(app.value.definition, 'appIcon')) {
                                    app.value.definition.appIcon = app.value.definition.tags.filter(s => s.includes('appIcon'))[0].split(':')[1];
                                }
                                $scope.appMeta = app;
                            };

                            $scope.getMeta();
                        },
                    ],
                });
            };
        }]);
}
