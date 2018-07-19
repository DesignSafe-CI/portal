(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('SimpleList', ['$http', '$q', '$translate', 'djangoUrl', 'appIcons', function($http, $q, $translate, djangoUrl, appIcons) {

    var SimpleList = function(){
      this.selected = null,
      this.lists = {},
      this.map = {}
    };

    SimpleList.prototype.deleteList = function(query, tab){
      var self = this;
      var deferred = $q.defer();
      $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {'q': query}
      }).then(
        function(response){
          var metadata = {};
          if (response.data.length > 0){
            $http({
              url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
              method: 'DELETE',
              params: {'uuid': response.data[0].uuid},
            }).then(
              function(response){
                deferred.resolve(self);
              },
              function(error){
                deferred.reject(response);
              });
          } else {
            deferred.reject();
          }
        },
        function(response){
          deferred.reject(response);
        });

      return deferred.promise;
    };

    SimpleList.prototype.saveList = function(query, tab, list) {
      var self = this;
      var deferred = $q.defer();
      $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['meta']),
        method: 'GET',
        params: {'q': query}
      }).then(
        function(response){
          var metadata = {};
          if (response.data.length === 0){
            // create metadata
            metadata.name = $translate.instant('apps_metadata_list_name');
            metadata.value = {};
            metadata.value.label = list.listName;
            metadata.value.apps = [];
            angular.forEach(list.items, function(app){
              metadata.value.apps.push(app);
            });
          } else {
            // update metadata
            metadata.uuid = response.data[0].uuid;
            metadata.name = $translate.instant('apps_metadata_list_name');
            metadata.value = {};
            metadata.value.label = list.listName;
            metadata.value.apps = [];
            angular.forEach(list.items, function(app){
              metadata.value.apps.push(app);
            });
          }
          $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['meta']),
            method: 'POST',
            data: metadata
          }).then(
            function(resp){
              var simpleList = tab;
              simpleList.content.selected = null;
              simpleList.content = [];
              angular.forEach(tab.multiple.lists[1].items, function(app){
                simpleList.content.push(app)
              });
              simpleList.title = list.listName;
              simpleList.edit = false;
              deferred.resolve(self);
            },
            function(apps){
              deferred.reject();
            }
          )
        },
        function(apps){
          deferred.reject();
        });
      return deferred.promise;
    };

    SimpleList.prototype.getDefaultLists = function(query) {
      var self = this;
      var deferred = $q.defer();
      $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {'q': query}
      }).then(
        function(response){
          self.lists['Private'] = [];
          self.lists['Public'] = [];

          angular.forEach(response.data, function(appMeta){
            self.map[appMeta.value.definition.id] = appMeta;

            // If label is undefined, set as id
            if (!appMeta.value.definition.label) {
              appMeta.value.definition.label = appMeta.value.definition.id;
            }

            // Parse app icon from tags for agave apps, or from metadata field for html apps
            appMeta.value.definition.icon = null;
            if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('appIcon')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appIcon')).length != 0) {
              appMeta.value.definition.icon = appMeta.value.definition.tags.filter(s => s.includes('appIcon'))[0].split(':')[1];
            } else if (appMeta.value.definition.hasOwnProperty('appIcon')) {
              appMeta.value.definition.icon = appMeta.value.definition.appIcon;
            } else (
              appIcons.some(function (icon) {
                if (appMeta.value.definition.label.toLowerCase().includes(icon)) {
                  appMeta.value.definition.icon = appMeta.value.definition.orderBy = icon;
                  return true;
                }
              })
            );
            if (appMeta.value.definition.icon == '') {
              appMeta.value.definition.icon = null;
            }

            if (appMeta.value.definition.isPublic){
              self.lists['Public'].push(
                appMeta
              );
            } else {
              self.lists['Private'].push(
                appMeta
            );
            }
          });

          deferred.resolve(self);
        },
        function(apps){
          deferred.reject();
        }
      )
      return deferred.promise;
    };


    SimpleList.prototype.getUserLists = function(query) {
      var self = this;
      var deferred = $q.defer();

      $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {'q': query}
      }).then(
        function(response){
          if (response.data.length > 0){
            _.each(response.data, function(appListMeta){
              self.lists[appListMeta.value.label] = [];
              _.each(appListMeta.value.apps, function(app){
                self.lists[appListMeta.value.label].push(self.map[app.value.definition.id]);
              });
            });
          }
          deferred.resolve(self);
        },
        function(apps){
          deferred.reject();
        }
      )
      return deferred.promise;
    };

    return SimpleList;
  }]);

})(window, angular, jQuery, _);
