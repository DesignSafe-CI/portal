export function appsMultipleListService(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('MultipleList', ['$http', '$q', 'djangoUrl', function($http, $q, djangoUrl) {

    var MultipleList = function() {
          this.lists = []
        };

    MultipleList.prototype.addEditLists = function(query, name, apps) {
        var self = this;
        var deferred = $q.defer();

        $http({
          url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
          method: 'GET',
          params: {'q': query}
        }).then(
          function(response){

            // Push apps list
            var appList = {};
            appList.listName = 'Apps';
            appList.dragging = false;
            appList.items = [];

            for (var i = 0; i < response.data.length; i++){
              var exists = false;
              for (var j = 0; j < apps.length; j++){
                if (response.data[i].value.definition.id === apps[j].value.definition.id){
                  exists = true;
                  break;
                }
              }
              if (exists === false){
                appList.items.push(
                  response.data[i]
                );
              }
            }

            self.lists.push(appList);

            // Push user new list
            var userAppList = {};
            userAppList.listName = name;
            userAppList.dragging = false;
            userAppList.items = [];
            angular.forEach(apps, function(app){
              userAppList.items.push(app);
            });
            self.lists.push(userAppList);

            deferred.resolve(self);
          },
          function(apps){
            deferred.reject();
          }
        )

        return deferred.promise;
    };


    MultipleList.prototype.addMultipleLists = function(name, query) {
        var self = this;
        var deferred = $q.defer();

        $http({
          url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
          method: 'GET',
          params: {'q': query}
        }).then(
          function(response){
            // Push apps list
            var appList = {};
            appList.listName = 'Apps';
            appList.dragging = false;
            appList.items = [];
            angular.forEach(response.data, function(app){
              appList.items.push(
                // {
                //   id: app.value.id,
                //   label: app.value.label,
                //   type: app.value.type,
                //   version: app.value.version,
                //   available: app.value.available,
                //   isPublic: app.value.isPublic
                // }
                app
              );
            });
            self.lists.push(appList);

            // Push user new list
            var newAppList = {};
            newAppList.listName = name;
            newAppList.dragging = false;
            newAppList.items = [];
            self.lists.push(newAppList);

            deferred.resolve(self);
          },
          function(apps){
            deferred.reject();
          }
        )

        return deferred.promise;
    };

    return MultipleList;
  }]);

}