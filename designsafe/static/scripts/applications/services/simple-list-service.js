export function simpleListFactory($http, $q, $translate, djangoUrl, appIcons, appCategories) {
    'ngInclude';

    let SimpleList = function() {
        this.selected = null;
        this.lists = {};
        this.map = {};
    };

    SimpleList.prototype.getDefaultLists = function(query) {
        let self = this,
            deferred = $q.defer();
        $http({
            url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { q: query },
        }).then(
            function(response) {
                self.lists['Private'] = [];
                self.lists['Public'] = [];

                angular.forEach(response.data, function(appMeta) {
                    self.map[appMeta.value.definition.id] = appMeta;

                    // If label is undefined, set as id
                    if (!appMeta.value.definition.label) {
                        appMeta.value.definition.label = appMeta.value.definition.id;
                    }

                    // Parse app icon from tags for agave apps, or from metadata field for html apps
                    appMeta.value.definition.appIcon = null;
                    if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('appIcon')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appIcon')).length != 0) {
                        appMeta.value.definition.appIcon = appMeta.value.definition.tags.filter(s => s.includes('appIcon'))[0].split(':')[1];
                    } else {
                        appIcons.some(function(icon) {
                            if (appMeta.value.definition.label.toLowerCase().includes(icon)) {
                                appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                                return true;
                            }
                            return false;
                        });
                    }
                    if (appMeta.value.definition.appIcon == '') {
                        appMeta.value.definition.appIcon = null;
                    }

                    if (appMeta.value.definition.isPublic) {
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
            function(apps) {
                deferred.reject();
            }
        );
        return deferred.promise;
    };

    /**
     * Searches for a parameter in an Agave metadata.value.definition.tags field
     * @function
     * @param {Object} definition - Agave metadata.value.definition
     * @param {String} param - Parameter to search for in definition.tags, i.e. 'appIcon'
     * @return {Boolean}
     */
    SimpleList.prototype.tagIncludesParam = function(definition, param) {
        return definition.tags &&
            Array.isArray(definition.tags) &&
            definition.tags.filter(s => s.includes(`${param}:`))[0] &&
            definition.tags.filter(s => s.includes(`${param}:`))[0].split(':')[1];
    };

    return SimpleList;
}
