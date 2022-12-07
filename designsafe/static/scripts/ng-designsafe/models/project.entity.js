import _ from 'underscore'; //TODO: replace underscore with ES6 methods

/** Class representing a project entity.*/
export function ProjectEntityModel() {
    'ngInject';

    /**
     * @method
     * @param {String} str.
     */
    function _camelCaseToTitle(str) {
        str = str.replace(/([A-Z])/g, ' $1');
        str = str.charAt(0).toUpperCase() + str.slice(1);
        return str;
    }

    /**
     * @method
     * @param {Object} data
     */
    function ProjectEntity(data) {
        var self = this;
        angular.extend(self, data);
        self.getDisplayName();
        self.getRelFilePaths();
        var res = [];
        _.forEach(self.value.tags, function(val, tagsType) {
            var r = _.map(Object.keys(val), function(v) {
                return { tagType: tagsType, name: v, label: _camelCaseToTitle(v) };
            });
            res = res.concat(r);
        });
        self.tagsAsOptions = res;
    }

    var cssClasses = {
        'designsafe.project.model_config': { 'tag': 'tag-blue', 'text': 'ds-text-blue' },
        'designsafe.project.sensor_list': { 'tag': 'tag-green', 'text': 'ds-text-green' },
        'designsafe.project.event': { 'tag': 'tag-yellow', 'text': 'ds-text-red' },
        'designsafe.project.analysis': { 'tag': 'tag-light-blue', 'text': 'ds-text-light-blue' },
        'designsafe.project.report': { 'tag': 'tag-black', 'text': 'ds-text-black' },
        'designsafe.project.simulation.model': {'tag': 'tag-blue', 'text': 'ds-text-blue'},
        'designsafe.project.simulation.input': {'tag': 'tag-green', 'text': 'ds-text-green'},
        'designsafe.project.simulation.output': {'tag': 'tag-yellow', 'text': 'ds-text-red'},
        'designsafe.project.simulation.analysis': {'tag': 'tag-light-blue', 'text': 'ds-text-light-blue'},
        'designsafe.project.simulation.report': {'tag': 'tag-black', 'text': 'ds-text-black'},
        'designsafe.project.hybrid_simulation.global_model': {'tag': 'tag-blue', 'text': 'ds-text-blue'},
        'designsafe.project.hybrid_simulation.coordinator': {'tag': 'tag-green', 'text': 'ds-text-green'},
        'designsafe.project.hybrid_simulation.sim_substructure': {'tag': 'tag-orange', 'text': 'ds-text-orange'},
        'designsafe.project.hybrid_simulation.exp_substructure': {'tag': 'tag-purple', 'text': 'ds-text-purple'},
        'designsafe.project.hybrid_simulation.coordinator_output': {'tag': 'tag-yellow', 'text': 'ds-text-yellow'},
        'designsafe.project.hybrid_simulation.exp_output': {'tag': 'tag-yellow', 'text': 'ds-text-yellow'},
        'designsafe.project.hybrid_simulation.sim_output': {'tag': 'tag-yellow', 'text': 'ds-text-yellow'},
        'designsafe.project.hybrid_simulation.analysis': {'tag': 'tag-light-blue', 'text': 'ds-text-light-blue'},
        'designsafe.project.hybrid_simulation.report': {'tag': 'tag-black', 'text': 'ds-text-black'},
        'designsafe.project.field_recon.report': {'tag': 'tag-black', 'text': 'ds-text-black'},
        'designsafe.project.field_recon.social_science': {'tag': 'tag-yellow', 'text': 'ds-text-yellow'},
        'designsafe.project.field_recon.geoscience': {'tag': 'tag-yellow', 'text': 'ds-text-yellow'},
        'designsafe.project.field_recon.planning': { 'tag': 'tag-green', 'text': 'ds-text-green' },
    };

    ProjectEntity.prototype.cssClasses = function() {
        var self = this;
        return cssClasses[self.name];
    };

    /**
     * Set relationships correctly
     * Note: This should be fired up once the
     * related properties are loaded into a
     * project object
     */
    ProjectEntity.prototype.setRels = function(project) {
        var self = this;
        var relatedFields = self._relatedFields;
        var relatedObjects = [];
        _.each(relatedFields, function(fieldName) {
            var relatedObjectUuids = angular.copy(self.value[fieldName]);
            _.each(relatedObjectUuids, function(uuid) {
                var relatedObject = project.getRelatedByUuid(uuid);
                if (typeof relatedObject !== 'undefined') {
                    relatedObjects.push(relatedObject);
                }
            });
            if (relatedObjects.length === 0) {
                relatedObjects = relatedObjectUuids;
            }
            self.value[fieldName] = relatedObjects;
            relatedObjects = [];
        });
    };

    /**
     * Update entity with data
     *
     */
    ProjectEntity.prototype.update = function(data) {
        var self = this;
        angular.extend(self, data);
        self._filePaths = undefined;
        self.getRelFilePaths();
    };

    /**
     * Returns display name based on the model name
     *
     */
    ProjectEntity.prototype.getDisplayName = function() {
        var self = this;
        if (typeof self._displayName === 'undefined') {
            var nameComps = self.name.split('.');
            nameComps = nameComps[nameComps.length - 1].split('_');
            var displayName = '';
            _.each(nameComps, function(part) {
                displayName += part.charAt(0).toUpperCase() + part.substr(1);
            });
            self._displayName = displayName;
        }
        if (self._displayName === 'SensorList') self._displayName = 'Sensor Information';
        if (self._displayName === 'ModelConfig') self._displayName = 'Model Configuration';

        return self._displayName;
    };

    /**
     * Returns and sets file paths of all related files
     *
     */
    ProjectEntity.prototype.getRelFilePaths = function() {
        var self = this;
        var filePaths = [];
        if (typeof self._filePaths === 'undefined') {
            if (typeof self._links !== 'undefined' && typeof self._links.associationIds !== 'undefined') {
                _.each(self._links.associationIds, function(asc) {
                    if (asc.title === 'file') {
                        var hrefComps = asc.href.split('system');
                        if (hrefComps.length === 2) {
                            var comps = hrefComps[1].split('/').splice(2);
                            let filePath = comps.join('/');
                            if (comps.length >= 2 && comps[1].toLowerCase() != '.trash' &&
                                comps[1].toLowerCase() != 'trash') {
                                filePaths.push(filePath);
                            }
                        }
                    }
                });
                self._filePaths = filePaths;
            } else {
                self._filePaths = [];
            }
        }
        return self._filePaths;
    };

    ProjectEntity.prototype.isRelatedToFile = function(file) {
        var self = this;
        var filePaths = self.getRelFilePaths();
        var rel = _.find(filePaths, function(filePath) {
            return file.path === filePath;
        });
        if (typeof rel !== 'undefined') {
            return true;
        }
        return false;
    };

    ProjectEntity.prototype.getFileSubTag = function(file) {
        var self = this;
        var tags = self.value.tags;
        var tag;
        var equal = function(val) {
            return val === file.uuid();
        };
        var predicate = function(item) {
            return _.findIndex(item.file, equal) > -1;
        };
        for (var t in tags) {
            for (var st in tags[t]) {
                var _tag = _.find(tags[t][st], predicate);
                if (_tag) {
                    tag = { tag: st, desc: _tag.desc };
                }
            }
        }
        return tag;
    };

    /*
     * @method
     * @param {String} uuid. Parent uuid.
     *
     * @returns {Object} order. {parent, value}
     *
     * Order weight depends on the parent entity (specifically for a tree view.).
     * Meaning, a single entity could have multiple order values which defines
     * which order does the entity have depending of which parent it has when
     * rendering.
     */
    ProjectEntity.prototype.orderOf = function(parentUuid) {
        var self = this;
        let order = _.findWhere(self._ui.orders, { parent: parentUuid });
        return order || { value: null };
    };

    /*
     * @method
     * @param {String} uuid. Parent uuid
     * @param {Integer} order
     *
     * Sets order for parent.
     */
    ProjectEntity.prototype.setOrderFor = function(parentUuid, order) {
        var self = this;
        self._ui.orders = _.filter(self._ui.orders, (obj) => {
            return obj.parent !== parentUuid;
        });
        self._ui.orders.push({ parent: parentUuid, value: order });
        return self;
    };

    return ProjectEntity;
}
