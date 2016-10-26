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
     * @param options
     * @param {string} options.uuid The Project uuid
     * @returns {Promise}
     */
    service.manageCollaborators = function(options) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-add-collaborator.html',
        controller: ['$scope', '$uibModalInstance', '$q', 'Django', 'UserService', function ($scope, $uibModalInstance, $q, Django, UserService) {
          $scope.data = {
            busy: true
          };
          $scope.form = {
            curUsers: [],
            addUsers: [{}]
          };
          var loads = [
            projectResource.get({params: angular.copy(options)}),
            collabResource.get({params: angular.copy(options)})
          ];
          $q.all(loads).then(function (results) {
            $scope.data.busy = false;
            $scope.data.project = results[0].data;

            $scope.form.curUsers = _.map(results[1].data, function (collab) {
              return {
                user: {username: collab},
                remove: false
              };
            });
          }, function (error) {
            $scope.data.busy = false;
            $scope.data.error = error.data.message || error.data;
          });

          $scope.canManage = function (user) {
            var noManage = $scope.data.project.value.pi === user ||
              Django.user === user ||
              user === 'ds_admin';
            return ! noManage;
          };

          $scope.formatSelection = function() {
            if (this.add.user) {
              return this.add.user.first_name +
                ' ' + this.add.user.last_name +
                ' (' + this.add.user.username + ')';
            }
          };

          $scope.addAnother = function () {
            $scope.form.addUsers.push({});
          };

          $scope.searchUsers = function (q) {
            return UserService.search({q: q});
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.saveCollaborators = function ($event) {
            $event.preventDefault();
            $scope.data.busy = true;

            var removeActions = _.map($scope.form.curUsers, function (cur) {
              if (cur.remove) {
                return collabResource.delete({data: {
                  uuid: $scope.data.project.uuid,
                  username: cur.user.username
                }});
              }
            });

            var addActions = _.map($scope.form.addUsers, function (add) {
              if (add.user && add.user.username) {
                return collabResource.post({data: {
                  uuid: $scope.data.project.uuid,
                  username: add.user.username
                }});
              }
            });

            var tasks = removeActions.concat(addActions);
            $q.all(tasks).then(
              function (results) {
                $uibModalInstance.close(results);
              },
              function (error) {
                $uibModalInstance.reject(error.data);
              }
            );
          };
        }]
      });

      return modal.result;
    };


    /**
     * @param {Project} [project]
     * @return {Promise}
     */
    service.editProject = function(project) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-edit-project.html',
        controller: ['$scope', '$uibModalInstance', 'UserService', 'project', function ($scope, $uibModalInstance, UserService, project) {
          $scope.ui = {busy: false,
                       error: null};
          $scope.form = {};
          if (project) {
            $scope.form.uuid = project.uuid;
            $scope.form.title = project.value.title;
            UserService.get(project.value.pi).then(function (user) {
              $scope.form.pi = user;
            });
          }


          $scope.searchUsers = function(q) {
            return UserService.search({q: q});
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
            $scope.ui.busy = true;
            var projectData = {
              title: $scope.form.title,
              pi: $scope.form.pi.username
            };
            if ($scope.form.uuid) {
              projectData.uuid = $scope.form.uuid;
            }
            service.save(projectData).then(function (project) {
              $uibModalInstance.close(project);
              $scope.ui.busy = false;
            });
          };
        }],
        resolve: {
          project: function () { return project; }
        }
      });

      return modal.result;
    };

    return service;

  }]);
})(window, angular, _);
