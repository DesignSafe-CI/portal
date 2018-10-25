import _ from 'underscore';
export function ProjectModel(Logging) {
    'ngInject';
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
      var entInd = 0;
      _.each(entities, function(ent){
        ent._ui.order = entInd;
        entInd += 1;
      });
      var attribute = self.getRelatedAttrName(name);
      self[attribute] = entities;
    };
    
    /***
     * Set entities relationship correctly
     * @param {Array} entities Array of ProjectEntity object
     *
     */
    Project.prototype.appendEntitiesRel = function(entities){
      var self = this;
      if (entities.length === 0){
        return;
      }
      _.each(entities, function(ent){
        var attribute = self.getRelatedAttrName(ent.name);
        if (typeof self[attribute] === 'undefined'){
          ent._ui.order = 0;
          self[attribute] = [ent];
        } else {
          ent._ui.order = parseInt(self[attribute][self[attribute].length-1]._ui.order) + 1;
          self[attribute].push(ent);
        }
      });
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
    Project.prototype.getRelated = function(attrName, uuids, relatedAttribute){
      var self = this;
      var relations = [];
      if (!_.isArray(uuids)){
        uuids = [uuids];
      }
      var ret = _.filter(self[attrName], function(entity){
        if (_.isEmpty(relatedAttribute) ||
            typeof relatedAttribute === 'undefined'){
          relations = entity.associationIds;
        } else {
          relations = entity.value[relatedAttribute] || [];
        }
        if ( _.isEmpty(relations)){
          return;
        }
        if (_.difference(uuids, relations).length === 0){
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

    Project.prototype.removeEntity = function(entity){
        var self = this;
        var entityAttr = self.getRelatedAttrName(entity.name);
        var entitiesArray = self[entityAttr];
        entitiesArray = _.filter(entitiesArray, function(e){
                return e.uuid !== entity.uuid;
            });
        self[entityAttr] = entitiesArray;
    };

    Project.prototype.dateOfPublication = function(){
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; //January is 0!

      var yyyy = today.getFullYear();
      if(dd<10){
              dd='0'+dd;
      } 
      if(mm<10){
              mm='0'+mm;
      } 
      today = mm + '/' + dd + '/' + yyyy;
      return today;
    };

    Project.prototype.participantInstitutions = function(experiments){
      self = this;
      return _.map(experiments, function(exp){
          return exp.getEF(self.value.projectType,
                           exp.value.experimentalFacility);
      });
    };

    return Project;
  }
