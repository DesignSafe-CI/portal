(function(window, angular, _, undefined) {
  "use strict";

  function Project(data) {

    var self = _.extend({}, data);

    self.getValue = function(key) {
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

    return self;
  }

  var mod = angular.module('ng.designsafe');

  mod.factory('ProjectService', ['httpi', '$interpolate', '$q', 'Logging', function(httpi, $interpolate, $q, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.ProjectService');

    var service = {};

    var projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    var dataResource = httpi.resource('/api/projects/:uuid/data/').setKeepTrailingSlash(true);

    /**
     * Get a list of Projects for the current user
     * @returns {Array.<Project>}
     */
    service.list = function() {
      return projectResource.get().then(function(resp) {
        return _.map(resp.data.projects, function(p) { return new Project(p); });
      });
    };

    /**
     * Get a specific Project
     * @param {Object} options
     * @param {string} options.uuid The Project UUID
     * @returns {HttpPromise}
     */
    service.get = function(options) {
      return projectResource.get({params: options}).then(function(resp) {
        return new Project(resp.data);
      });
    };

    /**
     * Save or update a Project
     * @param {Object} options
     * @param {string} options.uuid The Project uuid, if updating existing record, otherwise null
     * @param {string} options.title The Project title
     * @param {string} options.pi The username for Project PI
     * @param {Array.<string>} options.coPis List of usernames for Project Co-PIs
     * @returns {HttpPromise}
     */
    service.save = function(options) {
      return projectResource.post({data: options});
    };

    /**
     * Get a list of usernames for users that are collaborators on the Project
     * @param {Object} options
     * @param {string} options.uuid The Project uuid
     * @returns {HttpPromise}
     */
    service.getCollaborators = function(options) {
      return collabResource.get({params: options});
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {HttpPromise}
     */
    service.addCollaborator = function(options) {
      return collabResource.post({data: options});
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {HttpPromise}
     */
    service.removeCollaborator = function(options) {
      return collabResource.delete({data: options});
    };

    /**
     *
     * @param project
     * @param {string} project.uuid The Project uuid
     * @returns {HttpPromise}
     */
    service.projectData = function(project) {
      return dataResource.get({params: project});
    };

    return service;

  }]);
})(window, angular, _);
