(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('SimpleList', ['$http', '$q', 'djangoUrl', function($http, $q, djangoUrl) {

    var SimpleList = function(){
      this.selected = null,
      this.lists = {},
      this.map = {}
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
            if (appMeta.value.definition.isPublic){
              if (appMeta.value.definition.available){
                self.lists['Public'].push(
                  appMeta
                );
              }
            } else {
              if (appMeta.value.definition.available){
                self.lists['Private'].push(
                  appMeta
                );
              }
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
      );
      return deferred.promise;
    };


    return SimpleList;
  }]);

})(window, angular, jQuery, _);
