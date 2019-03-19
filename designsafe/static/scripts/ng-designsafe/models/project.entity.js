import _ from 'underscore';

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
        if (self.name === 'designsafe.project.experiment') {
            self._ui.efs = {
                experimental: [
                    {
                        name: 'atlss',
                        label:
                            'Advanced Technology for Large Structural Systems (ATLSS) Engineering Research Center, Lehigh University',
                    },
                    { name: 'cgm-ucdavis', label: 'Center for Geotechnical Modeling, UC Davis' },
                    { name: 'eqss-utaustin', label: 'Field mobile shakers, UT Austin' },
                    {
                        name: 'pfsml-florida',
                        label: 'Powell Family Structures and Materials Laboratory, University of Florida',
                    },
                    {
                        name: 'wwhr-florida',
                        label:
                            'Wall of Wind International Hurricane Research Center, Florida International University',
                    },
                    {
                        name: 'lhpost-sandiego',
                        label: 'Large High Performance Outdoor Shake Table, University of California San Diego',
                    },
                    {
                        name: 'ohhwrl-oregon',
                        label: 'O.H. Hinsdale Wave Research Laboratory, Oregon State University',
                    },
                    { name: 'other', label: 'Other' },
                ],
                other: [{ name: 'other', label: 'Other' }],
            };
            self._ui.equipmentTypes = {
                atlss: [
                    { name: 'hybrid_simulation', label: 'Hybrid Simulation' },
                    { name: 'other', label: 'Other' },
                ],
                'cgm-ucdavis': [
                    {
                        name: '9-m_radius_dynamic_geotechnical_centrifuge',
                        label: '9m Radius Dynamic Geotechnical Centrifuge',
                    },
                    {
                        name: '1-m_radius_dynamic_geotechnical_centrifuge',
                        label: '1m Radius Dynamic Geotechnical Centrifuge',
                    },
                    { name: 'other', label: 'Other' },
                ],
                'eqss-utaustin': [
                    { name: 'liquidator', label: 'Low Frequency, Two Axis Shaker (Liquidator)' },
                    { name: 't-rex', label: 'High Force Three Axis Shaker (T Rex)' },
                    { name: 'tractor-t-rex', label: 'Tractor-Trailer Rig, Big Rig, with T-Rex' },
                    { name: 'raptor', label: 'Single Axis Vertical Shaker (Raptor)' },
                    { name: 'rattler', label: 'Single Axis Horizontal Shaker (Rattler)' },
                    { name: 'thumper', label: 'Urban, Three axis Shaker (Thumper)' },
                    { name: 'other', label: 'Other' },
                ],
                'pfsml-florida': [
                    { name: 'blwt', label: 'Boundary Layer Wind Tunnel (BLWT)' },
                    { name: 'abl', label: 'Atmospheric Boundary Layer Wind Tunnel Test (ABL)' },
                    { name: 'wdrt', label: 'Wind Driven Rain Test' },
                    { name: 'wtdt', label: 'wind_tunnel_destructive_test' },
                    { name: 'dfs', label: 'Dynamic Flow Simulator (DFS)' },
                    { name: 'hapla', label: 'High Airflow Pressure Loading Actuator (HAPLA)' },
                    { name: 'spla', label: 'Spatiotemporal Pressure Loading Actuator (SPLA)' },
                    { name: 'other', label: 'Other' },
                ],
                'wwhr-florida': [
                    { name: 'pmtp', label: 'Physical_measurement_test_protocol' },
                    { name: 'fmtp', label: 'Failure Mode Test Protocol' },
                    { name: 'wdrtp', label: 'Wind Driven Rain Test Protocol' },
                    { name: 'other', label: 'Other' },
                ],
                'lhpost-sandiego': [
                    { name: 'lhpost', label: 'Large High Performance Outdoor Shake Table (LHPOST)' },
                    { name: 'other', label: 'Other' },
                ],
                'ohhwrl-oregon': [
                    { name: 'lwf', label: 'Large Wave Flume (LWF)' },
                    { name: 'dwb', label: 'Directional Wave Basin (DWB)' },
                    { name: 'mobs', label: 'Mobile Shaker' },
                    { name: 'pla', label: 'pressure_loading_actuator' },
                    { name: 'other', label: 'Other' },
                ],
                other: [{ name: 'other', label: 'Other' }],
            };
            self._ui.experimentTypes = {
                atlss: [
                    { name: 'hybrid_simulation', label: 'Hybrid Simulation' },
                    { name: 'other', label: 'Other' },
                ],
                'cgm-ucdavis': [{ name: 'centrifuge', label: 'Centrifuge' }, { name: 'other', label: 'Other' }],
                'eqss-utaustin': [
                    { name: 'mobile_shaker', label: 'Mobile Shaker' },
                    { name: 'other', label: 'Other' },
                ],
                'pfsml-florida': [{ name: 'wind', label: 'Wind' }, { name: 'other', label: 'Other' }],
                'wwhr-florida': [{ name: 'wind', label: 'Wind' }, { name: 'other', label: 'Other' }],
                'lhpost-sandiego': [{ name: 'shake', label: 'Shake' }, { name: 'other', label: 'Other' }],
                'ohhwrl-oregon': [{ name: 'wave', label: 'Wave' }, { name: 'other', label: 'Other' }],
                other: [{ name: 'other', label: 'Other' }],
            };
        }
    }

    var cssClasses = {
        'designsafe.project.model_config': { tag: 'tag-blue', text: 'ds-text-blue' },
        'designsafe.project.sensor_list': { tag: 'tag-green', text: 'ds-text-green' },
        'designsafe.project.event': { tag: 'tag-red', text: 'ds-text-red' },
        'designsafe.project.analysis': { tag: 'tag-light-blue', text: 'ds-text-light-blue' },
        'designsafe.project.report': { tag: 'tag-black', text: 'ds-text-black' },
        'designsafe.project.simulation.model': {'tag': 'tag-blue', 'text': 'ds-text-blue'},
        'designsafe.project.simulation.input': {'tag': 'tag-green', 'text': 'ds-text-green'},
        'designsafe.project.simulation.output': {'tag': 'tag-red', 'text': 'ds-text-red'},
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
    };

    ProjectEntity.prototype.cssClasses = function() {
        var self = this;
        return cssClasses[self.name];
    };

    ProjectEntity.prototype.getEF = function(projectType, str) {
        var self = this;
        if (typeof self._ui.efs[projectType] === 'undefined') {
            return 'None';
        }
        if (str == 'other') {
            return { name: 'other', label: self.value.experimentalFacilityOther };
        }
        var efs = self._ui.efs[projectType];
        var ef = _.find(efs, function(ef) {
            return ef.name === str;
        });
        return ef;
    };

    ProjectEntity.prototype.getExpType = function(ef, expType) {
        var self = this;
        if (typeof self._ui.experimentTypes[ef] === 'undefined') {
            return 'None';
        }
        if (expType == 'other') {
            return { name: 'other', label: self.value.experimentTypeOther };
        }
        var ets = self._ui.experimentTypes[ef];
        var et = _.find(ets, function(et) {
            return et.name === expType;
        });
        return et;
    };

    ProjectEntity.prototype.getET = function(type, str) {
        var self = this;
        if (typeof self._ui.equipmentTypes[type] === 'undefined') {
            return 'None';
        }
        if (str == 'other') {
            return { name: 'other', label: self.value.equipmentTypeOther };
        }
        var ets = self._ui.equipmentTypes[type];
        var et = _.find(ets, function(et) {
            return et.name === str;
        });
        return et;
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
        if (self._displayName === 'SensorList') self._displayName = 'Sensor List';

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
                            filePaths.push(comps.join('/'));
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
