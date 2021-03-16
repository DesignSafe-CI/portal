/**
 * Simple List Service
 * @function
 * @param {$http} $http
 * @param {$q} $q
 * @param {djangoUrl} djangoUrl
 * @param {Array} appCategories - Supported app categories
 * @param {Array} appIcons - Supported App Icons
 * @return {SimpleList}
 */
export function simpleListService($http, $q, djangoUrl, appCategories, appIcons) {
    'ngInclude';
    let SimpleList = function() {
        this.selected = null;
        this.lists = {};
        this.tabs = appCategories.concat(['My Apps']);
        this.binMap = {};
    };

    SimpleList.prototype.tagIncludesParam = function(definition, param) {
        return definition.tags &&
            Array.isArray(definition.tags) &&
            definition.tags.filter((s) => s.includes(`${param}:`))[0] &&
            definition.tags.filter((s) => s.includes(`${param}:`))[0].split(':')[1];
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
                /**
                 * Searches for a parameter in an Agave metadata.value.definition.tags field
                 * @function
                 * @param {Object} definition - Agave metadata.value.definition
                 * @param {String} param - Parameter to search for in definition.tags, i.e. 'appIcon'
                 * @return {Boolean}
                 */

                let appsByCategory = {};
                angular.forEach(self.tabs, function(tab) {
                    appsByCategory[tab] = [];
                });

                angular.forEach(response.data, function(appMeta) {
                    if (appMeta.value.definition.available) {
                        // If label is undefined, set as id
                        if (!appMeta.value.definition.label) {
                            appMeta.value.definition.label = appMeta.value.definition.id;
                        }
                        // Apply label for ordering
                        appMeta.value.definition.orderBy = appMeta.value.definition.label;

                        // Parse app icon from tags for agave apps, or from metadata field for html apps
                        if (appMeta.value.type == 'html' && appMeta.value.definition.appIcon) {
                            let appIcon = appMeta.value.definition.appIcon;
                            appMeta.value.definition.appIcon = null;
                            appIcons.some(function(icon) {
                                if (appIcon.toLowerCase() == icon.toLowerCase()) {
                                    appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                                    return true;
                                }
                                return false;
                            });
                        } else if (self.tagIncludesParam(appMeta.value.definition, 'appIcon')) {
                            const appIcon = appMeta.value.definition.tags.filter((s) => s.includes('appIcon'))[0].split(':')[1];

                            // Use icon for binning of apps, with '_icon-letter' appended to denote the icon will be a letter, not a true icon
                            appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = `${appIcon}_icon-letter`;

                            // Overwrite icon string with correct formatting if icon is in supported appIcons list
                            appIcons.some(function(icon) {
                                if (appIcon.toLowerCase().includes(icon.toLowerCase())) {
                                    appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                                    return true;
                                }
                                return false;
                            });
                            // If icon not in tags, try to match label to tag
                        } else {
                            appIcons.some(function(icon) {
                                if (appMeta.value.definition.label.toLowerCase().includes(icon.toLowerCase())) {
                                    appMeta.value.definition.appIcon = appMeta.value.definition.orderBy = icon;
                                    return true;
                                }
                                return false;
                            });
                        }

                        // Place app in category
                        if (appMeta.value.definition.isPublic) {
                            // Check if category exists either as a metadata field, or in a tag
                            let appCategory;
                            if (appMeta.value.definition.appCategory) {
                                appCategory = appMeta.value.definition.appCategory;
                            } else if (self.tagIncludesParam(appMeta.value.definition, 'appCategory')) {
                                appCategory = appMeta.value.definition.tags.filter((s) => s.includes('appCategory'))[0].split(':')[1];
                            }

                            // Place appMeta in category
                            if (appCategory in appsByCategory) {
                                appsByCategory[appCategory].push(appMeta);
                            } else if (appCategory == 'Data Collections') {
                                appsByCategory['Hazard Apps'].push(appMeta);
                            } else {
                                // If App has no category, place in Simulation tab
                                appsByCategory['Simulation'].push(appMeta);
                            }
                        } else {
                            if (appMeta.value.definition.available) {
                                appsByCategory['My Apps'].push(appMeta);
                            }
                        }
                    }
                });

                /* Bin applications where multiple apps share the same icon, e.g. OpenSees or ADCIRC */
                angular.forEach(self.tabs, function(tab) {
                    self.lists[tab] = [];
                    self.binMap[tab] = {};
                });

                /* Loop through apps categorized into lists to create sublists of binned apps */
                for (const [appCategory, contents] of Object.entries(appsByCategory)) {
                    let bins = {};
                    angular.forEach(contents, function(appMeta) {
                        if (appMeta.value.definition.appIcon) {
                            const appIcon = appMeta.value.definition.appIcon;
                            let map = Object.assign({ binned: true }, appMeta);
                            bins[appIcon] = bins[appIcon] ? bins[appIcon].concat(map) : bins[appIcon] = [map];
                        }
                    });

                    /* Remove bins with only one app */
                    angular.forEach(bins, function(apps, bin) {
                        if (apps.length == 1) {
                            delete bins[bin];
                        }
                    });

                    /* For each binned app type, create a psuedo appMeta, binMeta, to store tile information
                    and the binned app list */
                    let binMeta = {};
                    angular.forEach(contents, function(appMeta) {
                        if (bins[appMeta.value.definition.appIcon]) {
                            let meta = {
                                applications: bins[appMeta.value.definition.appIcon],
                                value: {
                                    definition: {
                                        appIcon: appMeta.value.definition.appIcon.includes('_icon-letter') ? null : appMeta.value.definition.appIcon,
                                        label: appMeta.value.definition.appIcon,
                                        id: `${appMeta.value.definition.appIcon}::${appCategory}`,
                                        orderBy: appMeta.value.definition.appIcon,
                                    },
                                },
                            };
                            if (!binMeta[appMeta.value.definition.appIcon]) {
                                self.lists[appCategory].push(meta);
                                binMeta[appMeta.value.definition.appIcon] = true;

                                // Create list of dictionaries pointing to the index of each bin in the tab
                                self.binMap[appCategory][appMeta.value.definition.appIcon] = self.lists[appCategory].indexOf(meta);
                            }
                        } else {
                            // If icon is an icon-letter, delete icon
                            if (appMeta.value.definition.appIcon && appMeta.value.definition.appIcon.includes('_icon-letter')) {
                                delete appMeta.value.definition.appIcon;
                            }
                            self.lists[appCategory].push(appMeta);
                        }
                    });
                }

                deferred.resolve(self);
            },
            function() {
                deferred.reject();
            }
        );
        return deferred.promise;
    };

    return SimpleList;
}
