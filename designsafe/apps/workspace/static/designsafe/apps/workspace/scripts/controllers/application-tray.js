(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl',
    ['$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$translate', 'Apps', 'SimpleList', 'MultipleList', function($scope, $rootScope, $q, $timeout, $uibModal, $translate, Apps, SimpleList, MultipleList) {

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
            $scope.error = $translate.instant('error_tab_get');
            deferred.reject(response);
          });
        return deferred.promise;
      };

      $scope.addUserTabs = function(query, active){
        $scope.error = '';
        var self = this;
        var deferred = $q.defer();

        Apps.list(query)
          .then(
            function(response){
              angular.forEach(response.data, function(list){
                  $scope.simpleList.lists[list.value.label] = [];
                  angular.forEach(list.value.apps, function(app){
                    $scope.simpleList.lists[list.value.label].push({
                      label: app.id,
                      type: app.type
                    });
                  });
              });

              deferred.resolve();
            },
            function(response){
              $scope.error = $translate.instant('error_tab_get');
            }
          );
        return deferred.promise;
      };

      $scope.addTab = function(){
        $scope.error = '';
        $scope.requesting = true;
        var self = this;
        var deferred = $q.defer();
        var title = 'new_list';
        var promises = [];
        var appMultipleList = new MultipleList();
        var query = '{"value.type": "ds_app"}';

        promises.push(appMultipleList.addMultipleLists(title, '{"name": "ds_app"}'));

        $q.all(promises).then(
          function(data) {
            $scope.tabs.push({
              title: title,
              content: {},
              edit: true,
              multiple: appMultipleList,
              original: appMultipleList.lists[1],
              active: true,
              new: true
            })
            $scope.requesting = false;
          },
          function(error){
            $scope.error = $translate.instant('error_tab_add');
          });
        return deferred.promise;
      };

      $scope.editTab = function(tab){
        $scope.error = '';

        $scope.requesting = true;
        var self = this;
        var deferred = $q.defer();
        var promises = [];
        var appMultipleList = new MultipleList();
        var query = {'name':'ds_app'};
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
            function(){
              deferred.reject();
              $scope.error = $translate.instant('error_tab_edit');
            });

          return deferred.promise;
      };


      $scope.saveTab = function(tab, list){
        $scope.error = '';
        $scope.requesting = true;
        var query = {'name': 'ds_app_list', 'value.label':tab.title};
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
        angular.forEach(tab.original.items, function(item){
          simpleList.content.push({label: item.label, type: item.type})
        });
        simpleList.edit = false;
      };

      $scope.removeTab = function (event, index, tab) {
        $scope.error = '';
        event.preventDefault();
        event.stopPropagation();

        var modalInstance = $uibModal.open({
           templateUrl: '/static/designsafe/apps/workspace/html/application-tray-delete.html',
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
                  var query = {'name': 'ds_app_list', 'value.label': tab.title};
                  var simpleList = new SimpleList();

                  if (tab.new === true){
                    $scope.tabs.splice(index, 1);
                    $scope.requesting = false;
                    $uibModalInstance.dismiss();
                  } else {
                    simpleList.deleteList(query, tab)
                      .then(
                        function(data){
                          $scope.tabs.splice(index, 1);
                          $scope.requesting = false;
                          $uibModalInstance.dismiss();
                        },
                        function(data){
                          $scope.error = $translate.instant('error_tab_delete');
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


      $scope.data = {
        activeApp: null,
        publicOnly: false,
        type: null
      };

      function closeApp(label) {
        $rootScope.$broadcast('close-app', label);
        $scope.data.activeApp = null;
      }

      $scope.$on('close-app', function(e, label) {
        if ($scope.data.activeApp && $scope.data.activeApp.label === label) {
          $scope.data.activeApp = null;
        }
      });

      $scope.refreshApps = function() {
        $scope.error = '';
        $scope.requesting = true;
        $scope.tabs = [];

        var promises = [];
        // promises.push($scope.addDefaultTabs({'name': 'ds_app'}));
        promises.push($scope.addDefaultTabs({'name': 'ds_app', 'value.available': true}));
        // promises.push($scope.addUserTabs({'name': 'ds_app_list'}));

        $q.all(promises).then(
          function(data) {

            if ($scope.simpleList.lists['Private'].length > 0){
              $scope.tabs.push(
                {
                  title: 'Private',
                  content: $scope.simpleList.lists['Private']
                }
              );
            }

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
                })
              }
            });

            $timeout(function(){
              $scope.requesting = false;
            });
          },
          function(error){
          }
        );
      };

      $scope.refreshApps();

      $scope.launchApp = function(app) {
        if (!$scope.data.activeApp || $scope.data.activeApp.id !== app.id) {
          $scope.data.activeApp = app;
          $rootScope.$broadcast('launch-app', app);
        }
      };
    }]);

})(window, angular, jQuery, _);
