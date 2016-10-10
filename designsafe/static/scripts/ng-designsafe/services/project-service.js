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

  mod.factory('ProjectService', ['httpi', '$interpolate', '$q', '$uibModal', 'Logging', function(httpi, $interpolate, $q, $uibModal, Logging) {

    var logger = Logging.getLogger('DataDepot.ProjectService');

    var service = {};

    var projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    var dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);

    /**
     * Get a list of Projects for the current user
     * @returns {Project[]}
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
     * @returns {Promise}
     */
    service.get = function(options) {
      return projectResource.get({params: options}).then(function(resp) {
        return new Project(resp.data);
      });
    };

    /**
     * Save or update a Project
     * @param {Object} options
     * @param {string} [options.uuid] The Project uuid, if updating existing record, otherwise null
     * @param {string} options.title The Project title
     * @param {string} [options.pi] The username for Project PI
     * @param {string[]} [options.coPis] List of usernames for Project Co-PIs
     * @returns {Promise}
     */
    service.save = function(options) {
      return projectResource.post({data: options}).then(function (resp) {
        return new Project(resp.data);
      });
    };

    /**
     * Get a list of usernames for users that are collaborators on the Project
     * @param {Object} options
     * @param {string} options.uuid The Project uuid
     * @returns {Promise}
     */
    service.getCollaborators = function(options) {
      return collabResource.get({params: options});
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {Promise}
     */
    service.addCollaborator = function(options) {
      return collabResource.post({data: options});
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {Promise}
     */
    service.removeCollaborator = function(options) {
      return collabResource.delete({data: options});
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} [options.fileId] the Project data file id to list
     * @returns {Promise}
     */
    service.projectData = function(options) {
      return dataResource.get({params: options});
    };


    /**
     *
     * @return {Promise}
     */
    service.createProject = function() {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-create-project.html',
        controller: ['$scope', '$uibModalInstance', 'UserService', function ($scope, $uibModalInstance, UserService) {
          $scope.form = {
            title: '',
            pi: ''
          };

          $scope.searchUsers = function(q) {
            return UserService.search({q: q})
              .then(function(resp) {
                return resp.data;
              });
          };

          $scope.formatSelection = function() {
            if (this.form.pi) {
              return this.form.pi.first_name +
                ' ' + this.form.pi.last_name +
                ' (' + this.form.pi.username + ')';
            }
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.save = function () {
            var projectData = {
              title: $scope.form.title,
              pi: $scope.form.pi.username
            };
            return service.save(projectData)
          };
        }]
      });

      return modal.result;
    };

    return service;

  }]);
})(window, angular, _);
