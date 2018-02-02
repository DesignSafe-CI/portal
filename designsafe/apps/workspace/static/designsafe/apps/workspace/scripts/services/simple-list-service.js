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
          angular.forEach(['Simulation', 'Visualization', 'Data Processing', 'Utilities', 'My Apps'], function(tab) {
            self.lists[tab] = [];
          });

          // Current list of apps with an Icon
          const icons = ['compress', 'extract', 'matlab', 'paraview', 'hazmapper', 'jupyter', 'adcirc', 'qgis', 'ls-dyna', 'ls dyna', 'ls_dyna', 'visit', 'openfoam', 'opensees'];

          angular.forEach(response.data, function(appMeta){
            self.map[appMeta.value.definition.id] = appMeta;
            if (appMeta.value.definition.available) {
              // Apply app icon if available, and apply label for ordering
              appMeta.value.definition.orderBy = appMeta.value.definition.label;
              appMeta.value.definition.icon = null;
              icons.some(function (icon) {
                if (appMeta.value.definition.label.toLowerCase().includes(icon)) {
                  appMeta.value.definition.icon = appMeta.value.definition.orderBy = icon;
                  return true;
                }
              });
              if (appMeta.value.definition.isPublic){
                // If App has no category, place in Simulation tab
                try {
                  self.lists[appMeta.value.definition.appCategory].push(
                    appMeta
                  );
                } catch (error) {
                  self.lists['Simulation'].push(
                    appMeta
                  );
                }
              } else {
                if (appMeta.value.definition.available){
                  self.lists['My Apps'].push(
                    appMeta
                  );
                }
              }
            }
          });

          deferred.resolve(self);
        },
        function(apps){
          deferred.reject();
        }
      );
      return deferred.promise;
    };

    // SimpleList.prototype.getUserLists = function(query) {
    //   var self = this;
    //   var deferred = $q.defer();

    //   $http({
    //     url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
    //     method: 'GET',
    //     params: {'q': query}
    //   }).then(
    //     function(response){
    //       if (response.data.length > 0){
    //         _.each(response.data, function(appListMeta){
    //           self.lists[appListMeta.value.label] = [];
    //           _.each(appListMeta.value.apps, function(app){
    //             self.lists[appListMeta.value.label].push(self.map[app.value.definition.id]);
    //           });
    //         });
    //       }
    //       deferred.resolve(self);
    //     },
    //     function(apps){
    //       deferred.reject();
    //     }
    //   );
    //   return deferred.promise;
    // };


    return SimpleList;
  }]);

})(window, angular, jQuery, _);
