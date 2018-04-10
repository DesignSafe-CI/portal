(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('SimpleList', ['$http', '$q', 'djangoUrl', function($http, $q, djangoUrl) {

    var SimpleList = function(){
      this.selected = null,
      this.lists = {},
      this.map = {}
      this.tabs = ['Simulation', 'Visualization', 'Data Processing', 'Data Collections', 'Utilities', 'My Apps'];
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
          angular.forEach(self.tabs, function(tab) {
            self.lists[tab] = [];
          });

          // Current list of apps with an Icon
          const icons = ['compress', 'extract', 'matlab', 'paraview', 'hazmapper', 'jupyter', 'adcirc', 'qgis', 'ls-dyna', 'ls-pre/post', 'visit', 'openfoam', 'opensees'];

          angular.forEach(response.data, function(appMeta){
            self.map[appMeta.value.definition.id] = appMeta;
            if (appMeta.value.definition.available) {
              // If label is undefined, set as id
              if (!appMeta.value.definition.label) {
                appMeta.value.definition.label = appMeta.value.definition.id;
              }
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

    return SimpleList;
  }]);

})(window, angular, jQuery, _);
