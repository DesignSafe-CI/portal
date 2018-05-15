(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('SimpleList', ['$http', '$q', 'djangoUrl', 'appCategories', function ($http, $q, djangoUrl, appCategories) {

    var SimpleList = function(){
      this.selected = null;
      this.lists = {};
      this.map = {};
      this.tabs = appCategories.concat(['My Apps']);
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

          // Current list of apps with an Icon, maybe move this to agave metadata record
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
              if (appMeta.value.definition.isPublic) {
                // If App has no category, place in Simulation tab
                // Check if category exists either as a metadata field, or in a tag. Moving forward, all categories will be moved to tags
                var appCategory = 'Simulation';
                if (appMeta.value.definition.hasOwnProperty('appCategory')) {
                  appCategory = appMeta.value.definition.appCategory;
                } else if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('appCategory')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appCategory')).length != 0) {
                  appCategory = appMeta.value.definition.tags.filter(s => s.includes('appCategory'))[0].split(':')[1];
                }
                if (appCategory in self.lists) {
                  self.lists[appCategory].push(appMeta);
                } else if (appCategory == 'Data Collections') {
                  self.lists['Partner Data Apps'].push(appMeta);
                } else {
                  console.log(`No app category ${appCategory} found for ${appMeta.value.definition.id}.`);
                  self.lists['Simulation'].push(appMeta);
                }
              } else {
                if (appMeta.value.definition.available) {
                  self.lists['My Apps'].push(appMeta);
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
