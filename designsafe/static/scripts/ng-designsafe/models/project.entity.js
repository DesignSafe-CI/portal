(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('designsafe');

  module.factory('ProjectEntityModel', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.ProjectEntityModel');
    function ProjectEntity(data){
      var self = this;
      angular.extend(self, data);
      self.getDisplayName();
      self.getRelFilePaths();
    }

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

    return ProjectEntity;
  }]);
})(window, angular, jQuery, _);
