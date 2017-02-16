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

    self.getRelatedAttrName = function(name){
      var attrname = '';
      for (var relName in self._related){
          if (self._related[relName] === name){
            attrname = relName;
            break;
          }
      }
      return attrname;
    };

    return self;
  }

  var mod = angular.module('designsafe');
  mod.requires.push('django.context', 'httpi');

  mod.factory('ProjectService', ['httpi', '$interpolate', '$q', '$uibModal', 'Logging', function(httpi, $interpolate, $q, $uibModal, Logging) {

    var logger = Logging.getLogger('DataDepot.ProjectService');

    var service = {};

    var projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    var dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
    var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
    var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);

    /**
     * 
     * Get list of entities related to a project
     */
    service.listEntities = function(options){
      return entitiesResource.get({params: options}).then(function(resp){
        return resp.data;
      });
    };

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
    service.manageExperiments = function(options) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-manage-experiments.html',
        controller: ['$scope', '$uibModalInstance', '$q', 'Django', 'UserService', function ($scope, $uibModalInstance, $q, Django, UserService) {
          $scope.data = {
            busy: false,
            experiments: options.experiments,
            project: options.project
          };
          $scope.ui = {
              experiments: {}
              };
          $scope.form = {
            curExperiments: [],
            addExperiments: [{}],
            deleteExperiments: []
          };
          $scope.formcurExperiments = options.experiments;

          $scope.addExperiment = function () {
            $scope.form.addExperiments.push({});
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.delNewExperiment = function(index){
            $scope.form.addExperiments.splice(index, 1);
          };

          $scope.toggleDeleteExperiment = function(uuid){
            if (uuid in $scope.ui.experiments &&
                $scope.ui.experiments[uuid].deleted){
              var index = $scope.form.deleteExperiments.indexOf(uuid);
              $scope.form.deleteExperiments.slice(index, 1);
              $scope.ui.experiments[uuid].deleted = false;
            } else {
              $scope.form.deleteExperiments.push(uuid);
              $scope.ui.experiments[uuid] = {};
              $scope.ui.experiments[uuid].deleted = true;
            }
          };

          $scope.saveExperiments = function($event){
            $event.preventDefault();
            $scope.data.busy = true;
            var addActions = _.map($scope.form.addExperiments, function(exp){
              if (exp.title && exp.experimentalFacility && exp.experimentType && exp.description){
                return entitiesResource.post({
                  data: {
                    uuid: $scope.data.project.uuid,
                    name: 'designsafe.project.experiment',
                    entity: exp
                  }
                });
              }
            });

            var removeActions = _.map($scope.form.deleteExperiments, function(uuid){
              return entityResource.delete({
                data: {
                  uuid: uuid,
                }
              });
            });

            var tasks = addActions.concat(removeActions);

            $q.all(tasks).then(
              function (results) {
                $uibModalInstance.close(results);
              },
              function (error) {
                $uibModalInstance.reject(error.data);
              }
            );
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

            addActions.concat(_.map($scope.form.addCoPis, function (add) {
              if (add.user && add.user.username) {
                return collabResource.post({data: {
                  uuid: $scope.data.project.uuid,
                  username: add.user.username,
                  memberType: 'coPis'
                }});
              }
            }));

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
        }],
        size:'lg'
      });

      return modal.result;
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
            addUsers: [{}],
            curCoPis: [],
            addCoPis: [{}]
          };
          var loads = [
            projectResource.get({params: angular.copy(options)}),
            collabResource.get({params: angular.copy(options)})
          ];
          $q.all(loads).then(function (results) {
            $scope.data.busy = false;
            $scope.data.project = results[0].data;

            $scope.form.curUsers = _.map(results[1].data.teamMembers, function (collab) {
              return {
                user: {username: collab},
                remove: false
              };
            });
            $scope.form.curCoPis = _.map(results[1].data.coPis, function (collab) {
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

          $scope.addAnotherCoPi = function () {
            $scope.form.addCoPis.push({});
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

            addActions.concat(_.map($scope.form.addCoPis, function (add) {
              if (add.user && add.user.username) {
                return collabResource.post({data: {
                  uuid: $scope.data.project.uuid,
                  username: add.user.username,
                  memberType: 'coPis'
                }});
              }
            }));

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
        size: 'md',
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-edit-project.html',
        controller: ['$scope', '$uibModalInstance', 'UserService', 'project', function ($scope, $uibModalInstance, UserService, project) {
          $scope.ui = {busy: false,
                       error: null};
          $scope.form = {associatedProjectsAdded : [{}]};
          $scope.projectTypes = [{
              id: 'experimental',
              label: 'Experimental'},{
              id: 'simulation',
              label: 'Simulation'},{
              id: 'hybrid_simulation',
              label: 'Hybrid Simulation'},{
              id: 'field_reconnaissance',
              label: 'Field Reconnaissance'}, {
              id: 'other',
              label: 'Other'}];

          if (project) {
            $scope.form.uuid = project.uuid;
            $scope.form.title = project.value.title;
            $scope.form.awardNumber = project.value.awardNumber || '';
            $scope.form.indentifier = project.value.identifier || '';
            $scope.form.description = project.value.description || '';
            if (typeof project.value.projectType !== 'undefined'){
               $scope.form.projectType = _.find($scope.projectTypes, function(projectType){ return projectType.id === project.value.projectType; }); 
            }
            if (typeof project.value.associatedProjects !== 'undefined'){
               $scope.form.associatedProjects = _.filter(project.value.associatedProjects, function(associatedProject){ return typeof associatedProject.title !== 'undefined' && associatedProject.title.length > 0; });
            }
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

          $scope.addAssociatedProject = function(){
              $scope.form.associatedProjectsAdded.push({});
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.save = function () {
            $scope.ui.busy = true;
            var projectData = {
              title: $scope.form.title,
              awardNumber: $scope.form.awardNumber,
              description: $scope.form.description
            };
            if ($scope.form.pi && $scope.form.pi.username){
              projectData.pi = $scope.form.pi.username;
            }
            if ($scope.form.projectType.id !== 'undefined'){
              projectData.projectType = $scope.form.projectType.id;
            }
            if ($scope.form.uuid) {
              projectData.uuid = $scope.form.uuid;
            }
            if (typeof $scope.form.associatedProjectsAdded !== 'undefined'){
               $scope.form.associatedProjectsAdded = _.filter($scope.form.associatedProjectsAdded, function(associatedProject){ return typeof associatedProject.title !== 'undefined' && associatedProject.title.length > 0; });
               projectData.associatedProjects = $scope.form.associatedProjects || [];
               projectData.associatedProjects = _.filter(projectData.associatedProjects, function(associatedProject){ return !associatedProject.delete; });
               projectData.associatedProjects = projectData.associatedProjects.concat($scope.form.associatedProjectsAdded);
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
