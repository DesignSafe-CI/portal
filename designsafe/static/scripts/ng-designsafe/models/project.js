(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('designsafe');

  module.factory('ProjectModel', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.ProjetModel');
    var Project = function(data){
      var self = this;
      angular.extend(self, data);
    };

    Project.prototype.getValue = function(key) {
      var self = this;
      var val;
      var composite = key.split('.');
      if (composite.length === 0) {
        val = self[key];
      } else {
        val = _.reduce(composite, function(mem, val) {
          return mem[val];
        }, self);
      }
      return val;
    };
    
    Project.prototype.getRelatedAttrName = function(name){
      var self = this;
      var attrname = '';
      for (var relName in self._related){
          if (self._related[relName] === name){
            attrname = relName;
            break;
          }
      }
      return attrname;
    };
    
    /***
     * Set entities relationship correctly
     * @param {Array} entities Array of ProjectEntity object
     *
     */
    Project.prototype.setEntitiesRel = function(entities){
      var self = this;
      if (entities.length === 0){
        return;
      }
      var name = entities[0].name;
      if (typeof name === 'undefined'){
        return;
      }
      var attribute = self.getRelatedAttrName(name);
      self[attribute] = entities;
    };

    /**
     * Add a newly created entity to the correct relations
     *
     */
    Project.prototype.addEntity = function(entity){
      var self = this;
      for (var attr in self._related){
        if (self._related[attr] === entity.name){
          if ( typeof self[attr] === 'undefined'){
            self[attr] = [];
          }
          self[attr].push(entity);
        }
      }
      self._allRelatedObjects = undefined;
    };

    /***
     *
     * Set all relationship within related object.
     * Note: This should be called after all related objects are loaded.
     *
     */
    Project.prototype.setupAllRels = function(){
      var self = this;
      var _related = self._related;
      _.each(_related, function(name, entityAttr){
        _.each(self[entityAttr], function(entity){
          entity.setRels(self);
        });
      });
    };

    /***
     *
     * Get a related object by uuid.
     * @param {string} uuid Uuid of related object.
     *
     */
    Project.prototype.getRelatedByUuid = function(uuid){
        var self = this;
        var ret;
        _.each(self._related, function(name, attrname){
          var relatedObjects = self[attrname] || [];
          var rel = _.findWhere(relatedObjects, {uuid: uuid});
          if (typeof rel !== 'undefined'){
            ret = rel;
          }
        });
        return ret;
    };

    /**
     *
     * Get related objects.
     * @param {string} attrName Name of the attribute of the set of realted objects to search on.
     * @param {string} uuid Uuid of the related object.
     *
     */
    Project.prototype.getRelated = function(attrName, uuids){
      var self = this;
      if (!_.isArray(uuids)){
        uuids = [uuids];
      }
      var ret = _.filter(self[attrName], function(entity){
        if (_.difference(uuids, entity.associationIds).length === 0){
          return entity;
        }
      });
      return ret;
    };

    /**
     *
     * Return an array with all the related objects
     *
     */
    Project.prototype.getAllRelatedObjects = function(){
      var self = this;
      if (typeof self._allRelatedObjects === 'undefined'){
        var ret = [];
        _.each(self._related, function(name, attr){
          ret = ret.concat(self[attr]);
        });
        self._allRelatedObjects = _.compact(ret);
      }
      return self._allRelatedObjects;
    };

    /**
     *
     * Returns an entity if it's related to any file in the array
     * or any of the parent directories.
     *
     */
    Project.prototype.getParentEntity = function(files){
      var self = this;
      var entities = self.getAllRelatedObjects();
      var ret = _.filter(entities, function(entity){
          return _.find(files, function(file){
            return _.find(entity.getRelFilePaths(), function(filePath){
             var _fp = filePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
              var re = new RegExp('^' + _fp + '(\/|$)');
              //if (re.test(file.path) && file.path.replace(re, '').length > 0){
              if (re.test(file.path)){
                return true;
              }
            });
          });
      });
      return ret;
    };

    return Project;
  }]);
})(window, angular, jQuery, _);
