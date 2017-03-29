(function(window, angular, _, undefined) {
  "use strict";

  var mod = angular.module('designsafe');
  mod.requires.push('django.context', 'httpi');

  mod.factory('ProjectService', ['httpi', '$interpolate', '$q', '$uibModal', 'Logging', 'ProjectModel', 'ProjectEntitiesService', function(httpi, $interpolate, $q, $uibModal, Logging, ProjectModel, ProjectEntitiesService) {

    var logger = Logging.getLogger('DataDepot.ProjectService');

    var efs = {
      'experimental': [
        {name: 'none', label: 'None'},
        {name: 'atlss', label: 'Advanced Technology for Large Structural Systems (ATLSS) Engineering Research Center, Lehigh University'},
         {name: 'cgm-ucdavis', label: 'Center for Geotechnical Modeling, UC Davis'},
         {name: 'eqss-utaustin', label: 'Experimental equipment site specializing in dynamic in-situ testing using mobile shakers, UT Austin'},
         {name: 'pfsml-florida', label: 'Powell Family Structures and Materials Laboratory, University of Florida'},
         {name: 'wwhr-florida', label: 'Wall of Wind International Hurricane Research Center, Florida International University'},
         {name: 'lhpost-sandiego', label: 'Large High Performance Outdoor Shake Table, University of California San Diego'},
         {name: 'ohhwrl-oregon', label:  'O.H. Hinsdale Wave Research Laboratory, Oregon State University'}
      ]
    };

    var equipmentTypes = {
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
    };

    var experimentTypes = {
      'atlss': [{name: 'hybrid_simulation', label:'Hybrid Simulation'}],
      'cgm-ucdavis':[{name: 'centrifuge', label:'Centrifuge'}],
      'eqss-utaustin':[{name: 'mobile_shaker', label:'Mobile Shaker'}],
      'pfsml-florida': [{name:'wind', label:'Wind'}],
      'wwhr-florida': [{name: 'wind', label:'Wind'}],
      'lhpost-sandiego': [{name: 'shake', label: 'Shake'}],
      'ohhwrl-oregon': [{name: 'wave', label:'Wave'}],
      'other': [{name: 'other', label:'Other'}]
    };

    var service = {};

    var projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    var dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
   //var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
   //var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);
   

    /**
     * Get a list of Projects for the current user
     * @returns {Project[]}
     */
    service.list = function() {
      return projectResource.get().then(function(resp) {
        return _.map(resp.data.projects, function(p) { return new ProjectModel(p); });
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
        return new ProjectModel(resp.data);
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
        return new ProjectModel(resp.data);
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
            project: options.project,
            form: {}
          };
          $scope.ui = {
              experiments: {},
              efs: efs,
              experimentTypes: experimentTypes,
              equipmentTypes: equipmentTypes
              };
          $scope.form = {
            curExperiments: [],
            addExperiments: [{}],
            deleteExperiments: [],
            entitiesToAdd:[]
          };
          $scope.form.curExperiments = $scope.data.project.experiment_set;

          $scope.addExperiment = function () {
            $scope.form.addExperiments.push({});
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.delNewExperiment = function(index){
            $scope.form.addExperiments.splice(index, 1);
          };

          $scope.getEF = function(str){
              var efs = $scope.ui.efs[$scope.data.project.value.projectType];
              var ef = _.find(efs, function(ef){
                return ef.name === str;
              });
              return ef;
          };

          $scope.getET = function(type, str){
              var ets = $scope.ui.experimentTypes[type];
              var et = _.find(ets, function(et){
                return et.name === str;
              });
              return et;
          };

          $scope.getTagList = function(entity){
            var tags = angular.copy(entyt.tags);
            var res = [];
            _.forEach(entity.value.tags, function(val, tagsType){
                var r = _.map(Object.keys(val), function(v){
                    return {tagType: tagsType, name: v, label: v};
                });
                res = res.concat(r);
            });
            return res;
          };

          $scope.toggleDeleteExperiment = function(uuid){
            if (uuid in $scope.ui.experiments &&
                $scope.ui.experiments[uuid].deleted){
              var index = $scope.form.deleteExperiments.indexOf(uuid);
              $scope.form.deleteExperiments.splice(index, 1);
              $scope.ui.experiments[uuid].deleted = false;
            } else {
              $scope.form.deleteExperiments.push(uuid);
              $scope.ui.experiments[uuid] = {};
              $scope.ui.experiments[uuid].deleted = true;
            }
          };

          $scope.saveExperiment = function($event){
            $event.preventDefault();
            $scope.data.busy = true;
            var addActions = _.map($scope.form.addExperiments, function(exp){
              if (exp.title && exp.experimentalFacility && exp.experimentType && exp.description){
                return ProjectEntitiesService.create({
                  data: {
                    uuid: $scope.data.project.uuid,
                    name: 'designsafe.project.experiment',
                    entity: exp
                  }
                }).then(function(res){
                  $scope.data.project.addEntity(res);
                });
              }
            });

            //var tasks = addActions.concat(removeActions);

            $q.all(addActions).then(
              function (results) {
                $scope.data.busy = false;
                $scope.form.addExperiments = [{}];
                //$uibModalInstance.close(results);
              },
              function (error) {
                $scope.data.error = error;
                //$uibModalInstance.reject(error.data);
              }
            );
          };

          $scope.removeExperiments = function($event){
            $event.preventDefault();
            $scope.data.busy = true;

            var removeActions = _.map($scope.form.deleteExperiments, function(uuid){
              return ProjectEntitiesService.delete({
                data: {
                  uuid: uuid,
                }
              });
            });

            $q.all(removeActions).then(
              function (results) {
                $scope.data.busy = false;
                $scope.form.addExperiments = [{}];
                //$uibModalInstance.close(results);
              },
              function (error) {
                $scope.data.error = error;
                //$uibModalInstance.reject(error.data);
              }
            );

          };

          $scope.delRelEntity = function(entity, rels){
            var _entity = angular.copy(entity);
            _.each(rels, function(rel, relName){
              _entity.associationIds = _.without(_entity.associationIds, rel);
              _entity.value[relName] = _.without(_entity.value[relName], rel);
            });
            ProjectEntitiesService.update({data: {uuid: entity.uuid, entity: _entity}})
            .then(function(res){
              options.project.getRelatedByUuid(res.uuid).update(res);
            },
            function(err){
              $uibModalInstance.reject(err.data);
            });
          };

          $scope.saveRelEntity = function(entity, rels){
            var _entity = angular.copy(entity);
            _.each(rels, function(rel, relName){
              _entity.associationIds.push(rel);
              _entity.value[relName].push(rel);
            });
            ProjectEntitiesService.update({data: {uuid: entity.uuid, entity: _entity}})
            .then(function(res){
              var attrName = '';
              for (var name in options.project._related){
                if (options.project._related[name] === res.name){
                  attrName = name;
                  break;
                }
              }
              var entity =  _.find(options.project[attrName], 
                                    function(entity){ if (entity.uuid === res.uuid){ return entity; }});
              entity.update(res);
            },
            function(err){
              $uibModalInstance.reject(err.data);
            });
          };

          $scope.ui.addingTag = false;
          $scope.ui.tagTypes = [
              {label: 'Model Config',
               name: 'designsafe.project.model_config'},
              {label: 'Sensor',
               name: 'designsafe.project.sensor_list'},
              {label: 'Event',
               name: 'designsafe.project.event'},
              {label: 'Analysis',
               name: 'designsafe.project.analysis'}
              ];
          $scope.ui.analysisData = [
            {name: 'graph', label: 'Graph'},
            {name: 'visualization', label: 'Visualization'},
            {name: 'table', label: 'Table'},
            {name: 'other', label: 'Other'}
          ];
          $scope.ui.analysisApplication = [
            {name: 'matlab', label: 'Matlab'},
            {name: 'r', label: 'R'},
            {name: 'jupyter', label: 'Jupyter'},
            {name: 'other', label: 'Other'}
          ];

          $scope.data.form.projectTagToAdd = {optional:{}};

          $scope.addProjectTag = function(){
            var newTag = $scope.data.form.projectTagToAdd;
            var nameComps = newTag.tagType.split('.');
            var name = nameComps[nameComps.length-1];
            var entity = {};
            entity.name = newTag.tagType;
            if (name === 'event'){
              entity.eventType = newTag.tagAttribute;
            } else if (name === 'analysis'){
              entity.analysisType = newTag.tagAttribute;
            } else if (name === 'sensor_list'){
              entity.sensorListType = newTag.tagAttibute;
            } else if (name === 'model_config'){
              entity.coverage = newTag.tagAttribute;
            }
            for (var attr in $scope.data.form.projectTagToAdd.optional){
              entity[attr] = $scope.data.form.projectTagToAdd.optional[attr];
            }
            $scope.ui.addingTag = true;
            entity.title = newTag.tagTitle;
            entity.description = newTag.tagDescription;
            if (typeof $scope.data.files !== 'undefined'){
              entity.filePaths = _.map($scope.data.files,
                                     function(file){
                                      return file.path;
                                     });
            }
            $scope.ui.addingTag = true;
            ProjectEntitiesService.create({data: {
                uuid: currentState.project.uuid,
                name: newTag.tagType,
                entity: entity
            }})
            .then(
               function(resp){
                 $scope.data.form.projectTagToAdd = {optional:{}};
                 currentState.project.addEntity(resp);
                 _setFileEntities();
                 _setEntities();
                 $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
                 $scope.ui.error = false;
                 $scope.ui.addingTag = false;
               },
               function(err){
                 $scope.ui.error = true;
                 $scope.error = err;
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
            addCoPis: [{}],
            authors:{}
          };
          var loads = [
            //projectResource.get({params: angular.copy(options)}),
            service.get(angular.copy(options)),
            collabResource.get({params: angular.copy(options)}),
            ProjectEntitiesService.listEntities({uuid: options.uuid, name: 'designsafe.project.experiment'})
          ];
          $q.all(loads).then(function (results) {
            $scope.data.busy = false;
            $scope.data.project = results[0];
            $scope.data.experiments = results[2];

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
          $scope.efs = efs;

          if (project) {
            $scope.form.uuid = project.uuid;
            $scope.form.title = project.value.title;
            $scope.form.awardNumber = project.value.awardNumber || '';
            $scope.form.indentifier = project.value.identifier || '';
            $scope.form.description = project.value.description || '';
            $scope.form.experimentalFacility = project.value.experimentalFacility || '';
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
              description: $scope.form.description,
            };
            if ($scope.form.pi && $scope.form.pi.username){
              projectData.pi = $scope.form.pi.username;
            }

            //if (typeof $scope.form.experimentalFacility !== 'undefined'){
            //  projectData.experimentalFacility = $scope.form.experimentalFacility;
            //}
            if (typeof $scope.form.projectType.id !== 'undefined'){
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
