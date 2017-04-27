(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('designsafe');

  module.factory('ProjectEntityModel', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.ProjectEntityModel');

    function _camelCaseToTitle(str){
        str = str.replace(/([A-Z])/g, " $1");
        str = str.charAt(0).toUpperCase() + str.slice(1);
        return str;
    }

    function ProjectEntity(data){
      var self = this;
      angular.extend(self, data);
      self.getDisplayName();
      self.getRelFilePaths();
        var tags = angular.copy(self.tags);
        var res = [];
        _.forEach(self.value.tags, function(val, tagsType){
            var r = _.map(Object.keys(val), function(v){
                return {tagType: tagsType, name: v, label: _camelCaseToTitle(v)};
            });
            res = res.concat(r);
        });
      self.tagsAsOptions = res;
      self._ui = {order:0};
      if (self.name === 'designsafe.project.experiment'){
        self._ui = {
          order:0,
          efs: {
            'experimental': [
              {name: 'none', label: 'None'},
              {name: 'atlss', label: 'Advanced Technology for Large Structural Systems (ATLSS) Engineering Research Center, Lehigh University', institution: 'Lehigh University'},
               {name: 'cgm-ucdavis', label: 'Center for Geotechnical Modeling, UC Davis', institution: 'UC Davis'},
               {name: 'eqss-utaustin', label: 'Experimental equipment site specializing in dynamic in-situ testing using mobile shakers, UT Austin', institution: 'UT Austin'},
               {name: 'pfsml-florida', label: 'Powell Family Structures and Materials Laboratory, University of Florida', institution: 'University of Florida'},
               {name: 'wwhr-florida', label: 'Wall of Wind International Hurricane Research Center, Florida International University', institution: 'Florida International University'},
               {name: 'lhpost-sandiego', label: 'Large High Performance Outdoor Shake Table, University of California San Diego', institution: 'University of California San Diego'},
               {name: 'ohhwrl-oregon', label:  'O.H. Hinsdale Wave Research Laboratory, Oregon State University', institution: 'Oregon State University'}
            ]
          },
        experimentTypes: {
          'atlss': [{name: 'hybrid_simulation', label: 'Hybrid Simulation'}],
          'cgm-ucdavis': [{name: '9-m_radius_dynamic_geotechnical_centrifuge', label: '9m Radius Dynamic Geotechnical Centrifuge'},
                          {name: '1-m_radius_dynamic_geotechnical_centrifuge', label: '1m Radius Dynamic Geotechnical Centrifuge'}],
          'eqss-utaustin': [
            {name: 'liquidator', 
             label: 'Low Frequency, Two Axis Shaker (Liquidator)'},
            {name: 't-rex',
             label: 'High Force Three Axis Shaker (T Rex)'},
            {name: 'tractor-t-rex',
             label: 'Tractor-Trailer Rig, Big Rig, with T-Rex'},
            {name: 'raptor',
             label: 'Single Axis Vertical Shaker (Raptor)'},
            {name: 'rattler',
             label: 'Single Axis Horizontal Shaker (Rattler)'},
            {name: 'thumper',
             label: 'Urban, Three axis Shaker (Thumper)'}],
          'pfsml-florida': [
            {name: 'blwt', label: 'Boundary Layer Wind Tunnel (BLWT)'},
            {name: 'abl', label: 'Atmospheric Boundary Layer Wind Tunnel Test (ABL)'}, 
            {name: 'wdrt', label: 'Wind Driven Rain Test'},
            {name: 'wtdt', label: 'wind_tunnel_destructive_test'},
            {name: 'dfs', label: 'Dynamic Flow Simulator (DFS)'},
            {name: 'hapla', label: 'High Airflow Pressure Loading Actuator (HAPLA)'},
            {name: 'spla', label: 'Spatiotemporal Pressure Loading Actuator (SPLA)'} 
          ],
          'wwhr-florida': [{name: 'pmtp', label: 'Physical_measurement_test_protocol'}, 
                           {name: 'fmtp', label: 'Failure Mode Test Protocol'},
                           {name: 'wdrtp', label: 'Wind Driven Rain Test Protocol'}],
          'lhpost-sandiego': [{name: 'lhpost', label: 'Large High Performance Outdoor Shake Table (LHPOST)'}],
          'ohhwrl-oregon': [{name: 'lwf', label: 'Large Wave Flume (LWF)'},
                            {name: 'dwb', label: 'Directional Wave Basin (DWB)'},
                            {name: 'mobs', label: 'Mobile Shaker'}, 
                            {name: 'pla', label: 'pressure_loading_actuator'}]
        }
        };
      }
    }

    ProjectEntity.prototype.getEF = function(projectType, str){
        var self = this;
        var efs = self._ui.efs[projectType];
        var ef = _.find(efs, function(ef){
          return ef.name === str;
        });
        return ef;
    };

    ProjectEntity.prototype.getET = function(type, str){
        var self = this;
        var ets = self._ui.experimentTypes[type];
        var et = _.find(ets, function(et){
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
    ProjectEntity.prototype.setRels = function(project){
      var self = this;
      var relatedFields =  self._relatedFields;
      var relatedObjects = [];
      _.each(relatedFields, function(fieldName){
         var relatedObjectUuids = angular.copy(self.value[fieldName]);
         _.each(relatedObjectUuids, function(uuid){
           var relatedObject = project.getRelatedByUuid(uuid);
           if (typeof relatedObject !== 'undefined'){
             relatedObjects.push(relatedObject);
           }
         });
         if (relatedObjects.length === 0){
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
    ProjectEntity.prototype.update = function(data){
      var self = this;
      angular.extend(self, data);
      self._filePaths = undefined;
      self.getRelFilePaths();
    };

    /**
     * Returns display name based on the model name
     *
     */
    ProjectEntity.prototype.getDisplayName = function(){
      var self = this;
      if (typeof self._displayName === 'undefined'){
        var nameComps = self.name.split('.');
        nameComps = nameComps[nameComps.length - 1].split('_');
        var displayName = '';
        _.each(nameComps, function(part){
          displayName += part.charAt(0).toUpperCase() + part.substr(1);
        });
        self._displayName = displayName;
      }
      if (self._displayName === 'SensorList') self._displayName = 'Sensor Info';

      return self._displayName;
    };

    /**
     * Returns and sets file paths of all related files
     *
     */
    ProjectEntity.prototype.getRelFilePaths = function(){
      var self = this;
      var filePaths = [];
      if (typeof self._filePaths === 'undefined'){
        if (typeof self._links !== 'undefined' &&
            typeof self._links.associationIds !== 'undefined'){
            _.each(self._links.associationIds, function(asc){
              if (asc.title === 'file'){
                var hrefComps = asc.href.split('system');
                if (hrefComps.length === 2){
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

    ProjectEntity.prototype.isRelatedToFile = function(file){
      var self = this;
      var filePaths = self.getRelFilePaths();
      var rel = _.find(filePaths, function(filePath){
        return file.path === filePath;
      });
      if (typeof rel !== 'undefined'){
        return true;
      }
      return false;
    };

    ProjectEntity.prototype.getFileSubTag = function(file){
        var self = this;
        var tags = self.value.tags;
        var tag;
        var equal = function(val){
            return val === file.uuid();
        };
        var predicate = function(item){
            return _.findIndex(item.file, equal) > -1;
        };
        for (var t in tags){
            for(var st in tags[t]){
                var _tag = _.find(tags[t][st], predicate);
                if (_tag){
                    tag = {tag: st, desc: _tag.desc};
                }
            }
        }
        return tag;
    };

    return ProjectEntity;
  }]);
})(window, angular, jQuery, _);
