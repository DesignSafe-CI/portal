(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe')
  
  .directive('focusout', ['$parse', function($parse) {
    return {
      compile: function($element, attr) {
        var fn = $parse(attr.focusout);
        return function handler(scope, element) {
          element.on('focusout', function(event) {
            scope.$apply(function() {
              fn(scope, {$event:event});
            });
          });
        };
      }
    };
  }])
  
  .controller('ApplicationTrayCtrl',
    ['$location', '$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$state', '$stateParams', '$translate', 'Apps', 'SimpleList', 'MultipleList', 'toastr', '$mdToast', function(
      $location, $scope, $rootScope, $q, $timeout, $uibModal, $state, $stateParams, $translate, Apps, SimpleList, MultipleList, toastr, $mdToast) {
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
          });

        return deferred.promise;
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

        if ($stateParams.appId){
          Apps.getMeta($stateParams.appId)
            .then(
              function(response){
                if (response.data.length > 0){
                  if (response.data[0].value.definition.available){
                    $scope.launchApp(response.data[0]);
                  } else {
                    $mdToast.show($mdToast.simple()
                    .content($translate.instant('error_app_disabled'))
                    .toastClass('warning')
                    .parent($("#toast-container")));
                    // toastr.warning($translate.instant('error_app_disabled'));
                  }
                } else {
                  $mdToast.show($mdToast.simple()
                  .content($translate.instant('error_app_run'))
                  .toastClass('warning')
                  .parent($("#toast-container")));
                  // toastr.warning($translate.instant('error_app_run'));
                }
              },
              function(response){
                $mdToast.show($mdToast.simple()
                .content($translate.instant('error_app_run'))
                .toastClass('warning')
                .parent($("#toast-container")));
                // toastr.warning($translate.instant('error_app_run'));
              }
            );
        }

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
            const tabs = ['Simulation', 'Visualization', 'Data Processing', 'Utilities', 'Private'];

            tabs.forEach(function (element) {
                $scope.tabs.push(
                  {
                    title: element,
                    content: $scope.simpleList.lists[element],
                    count: $scope.simpleList.lists[element].length
                  }
                );            
            }, this);

            // angular.forEach($scope.simpleList.lists, function(list, key){
            //   if (key !== 'Public' && key !== 'Private') {
            //     $scope.tabs.push({
            //       title: key,
            //       content: list
            //     });
            //   }
            // });

            $scope.requesting = false;
          });
      };

      $scope.refreshApps();

      $scope.launchApp = function(app, tab) {
        $state.go(
          'tray',
          {appId: app.value.definition.id},
          {notify: false}
        );

        if (!$scope.data.activeApp || $scope.data.activeApp.value.definition.id !== app.value.definition.id) {
          $scope.data.activeApp = app;
          $rootScope.$broadcast('launch-app', app);
        }
        tab.active = false;
      };

      // Want all tabs to be inactive on start, and whenever user clicks outside the tab-tray.
      var outsideClick = false;
      $scope.showApps = function($event, tab) {
        if (outsideClick) {
          tab.active = false;
        }
      };

      $(document).mousedown(function(event) {
        var element = $(event.target);
        if (element.closest("div .apps-tray").length > 0 || element.closest(".workspace-tab").length > 0) {
          outsideClick = false;
        } else {
          outsideClick = true;
        }

        // If user clicks on same tab, close tab.
        if (element.closest(".workspace-tab").length == 1) {
          $scope.tabs.forEach(function (tab) {
            if (tab.active && element.closest(".workspace-tab-title").context.innerText.includes(tab.title)) {
              tab.active = false;
            }
          });
        }
      });

    }]);

})(window, angular, jQuery, _);
