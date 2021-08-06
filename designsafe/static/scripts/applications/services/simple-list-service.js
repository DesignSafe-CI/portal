import _ from 'underscore';

export class SimpleList {
    constructor($http, $q, appIcons) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.appIcons = appIcons;
        this.selected;
        this.lists = {};
        this.map = {};
        this.tabs = ['Private', 'Public'];
    }

    /**
     * Searches for a parameter in an Agave metadata.value.definition.tags field
     * @function
     * @param {Object} definition - Agave metadata.value.definition
     * @param {String} param - Parameter to search for in definition.tags, i.e. 'appIcon'
     * @return {Boolean}
     */
    tagIncludesParam(definition, param) {
        return definition.tags &&
            Array.isArray(definition.tags) &&
            definition.tags.filter((s) => s.includes(`${param}:`))[0] &&
            definition.tags.filter((s) => s.includes(`${param}:`))[0].split(':')[1];
    }

    getDefaultLists(query) {
        let self = this,
            deferred = this.$q.defer();
        this.$http({
            url: '/applications/api/meta/',
            method: 'GET',
            params: { q: query },
        }).then(
            function(response) {
                _.forEach(self.tabs, (tab) => {
                    self.lists[tab] = [];
                });

                angular.forEach(response.data, function(appMeta) {
                    self.map[appMeta.value.definition.id] = appMeta;

                    // If label is undefined, set as id
                    if (!appMeta.value.definition.label) {
                        appMeta.value.definition.label = appMeta.value.definition.id;
                    }

                    // Parse app icon from tags for agave apps, or from metadata field for html apps
                    if (appMeta.value.type == 'html' && appMeta.value.definition.appIcon) {
                        let appIcon = appMeta.value.definition.appIcon;
                        appMeta.value.definition.appIcon = null;
                        self.appIcons.some(function(icon) {
                            if (appIcon.toLowerCase() == icon.toLowerCase()) {
                                appMeta.value.definition.appIcon = icon;
                                return true;
                            }
                            return false;
                        });
                    } else if (self.tagIncludesParam(appMeta.value.definition, 'appIcon')) {
                        appMeta.value.definition.appIcon = appMeta.value.definition.tags.filter((s) => s.includes('appIcon'))[0].split(':')[1];
                    } else {
                        self.appIcons.some(function(icon) {
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
            function() {
                deferred.reject();
            }
        );
        return deferred.promise;
    }
}
