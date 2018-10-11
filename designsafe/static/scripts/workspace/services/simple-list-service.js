export function simpleListService ($http, $q, djangoUrl, appCategories, appIcons) {
    'ngInclude';
    var SimpleList = function(){
      this.selected = null;
      this.lists = {};
      this.hello = 'hi';
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

          angular.forEach(response.data, function(appMeta){
            self.map[appMeta.value.definition.id] = appMeta;
            if (appMeta.value.definition.available) {
              // If label is undefined, set as id
              if (!appMeta.value.definition.label) {
                appMeta.value.definition.label = appMeta.value.definition.id;
              }
              // Apply label for ordering
              appMeta.value.definition.orderBy = appMeta.value.definition.label;

              // Parse app icon from tags for agave apps, or from metadata field for html apps
              if (appMeta.value.definition.tags && appMeta.value.definition.tags.filter(s => s.includes('appIcon')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appIcon')).length != 0) {
                const appIcon = appMeta.value.definition.tags.filter(s => s.includes('appIcon'))[0].split(':')[1];

                // Use icon for binning of apps, with '_icon-letter' appended to denote the icon will be a letter, not a true icon
                appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = `${appIcon}_icon-letter`;

                // Overwrite icon string if icon is in supported appIcons list
                appIcons.some(function (icon) {
                  if (appIcon.toLowerCase().includes(icon.toLowerCase())) {
                    appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                    return true;
                  }
                })
              // If icon not in tags, try to match label to tag
              } else (
                appIcons.some(function (icon) {
                  if (appMeta.value.definition.label.toLowerCase().includes(icon)) {
                    appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                    return true;
                  }
                })
              );

              // Place app in category
              if (appMeta.value.definition.isPublic) {
                // If App has no category, place in Simulation tab
                // Check if category exists either as a metadata field, or in a tag
                var appCategory = '';
                if (appMeta.value.definition.appCategory) {
                  appCategory = appMeta.value.definition.appCategory;
                } else if (appMeta.value.definition.tags && appMeta.value.definition.tags.filter(s => s.includes('appCategory')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appCategory')).length != 0) {
                  appCategory = appMeta.value.definition.tags.filter(s => s.includes('appCategory'))[0].split(':')[1];
                }
                if (appCategory in self.lists) {
                  self.lists[appCategory].push(appMeta);
                } else if (appCategory == 'Data Collections') {
                  self.lists['Partner Data Apps'].push(appMeta);
                } else {
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
  }
