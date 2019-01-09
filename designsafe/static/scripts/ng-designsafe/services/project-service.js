import _ from 'underscore';
import { $IsStateFilter } from 'angular-ui-router/lib/stateFilters';

export function ProjectService(httpi, $interpolate, $q, $state, $uibModal, Logging, ProjectModel, ProjectEntitiesService) {
    'ngInject';

    var logger = Logging.getLogger('DataDepot.ProjectService');

    var efs = {
      'experimental': [
        {name: 'atlss', label: 'Advanced Technology for Large Structural Systems (ATLSS) Engineering Research Center, Lehigh University'},
         {name: 'cgm-ucdavis', label: 'Center for Geotechnical Modeling, UC Davis'},
         {name: 'eqss-utaustin', label: 'Field mobile shakers, UT Austin'},
         {name: 'pfsml-florida', label: 'Powell Family Structures and Materials Laboratory, University of Florida'},
         {name: 'wwhr-florida', label: 'Wall of Wind International Hurricane Research Center, Florida International University'},
         {name: 'lhpost-sandiego', label: 'Large High Performance Outdoor Shake Table, University of California San Diego'},
         {name: 'ohhwrl-oregon', label:  'O.H. Hinsdale Wave Research Laboratory, Oregon State University'},
        {name: 'other', label: 'Other'}
      ]
    };

    var equipmentTypes = {
      'atlss': [{name: 'hybrid_simulation', label: 'Hybrid Simulation'},
                {name: 'other', label:'Other'}],
      'cgm-ucdavis': [{name: '9-m_radius_dynamic_geotechnical_centrifuge', label: '9m Radius Dynamic Geotechnical Centrifuge'},
                      {name: '1-m_radius_dynamic_geotechnical_centrifuge', label: '1m Radius Dynamic Geotechnical Centrifuge'},
                {name: 'other', label:'Other'}],
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
         label: 'Urban, Three axis Shaker (Thumper)'},
                {name: 'other', label:'Other'}],
      'pfsml-florida': [
        {name: 'blwt', label: 'Boundary Layer Wind Tunnel (BLWT)'},
        {name: 'abl', label: 'Atmospheric Boundary Layer Wind Tunnel Test (ABL)'},
        {name: 'wdrt', label: 'Wind Driven Rain Test'},
        {name: 'wtdt', label: 'wind_tunnel_destructive_test'},
        {name: 'dfs', label: 'Dynamic Flow Simulator (DFS)'},
        {name: 'hapla', label: 'High Airflow Pressure Loading Actuator (HAPLA)'},
        {name: 'spla', label: 'Spatiotemporal Pressure Loading Actuator (SPLA)'},
                {name: 'other', label:'Other'}
      ],
      'wwhr-florida': [{name: 'pmtp', label: 'Physical_measurement_test_protocol'},
                       {name: 'fmtp', label: 'Failure Mode Test Protocol'},
                       {name: 'wdrtp', label: 'Wind Driven Rain Test Protocol'},
                {name: 'other', label:'Other'}],
      'lhpost-sandiego': [{name: 'lhpost', label: 'Large High Performance Outdoor Shake Table (LHPOST)'},
                {name: 'other', label:'Other'}],
      'ohhwrl-oregon': [{name: 'lwf', label: 'Large Wave Flume (LWF)'},
                        {name: 'dwb', label: 'Directional Wave Basin (DWB)'},
                        {name: 'mobs', label: 'Mobile Shaker'},
                        {name: 'pla', label: 'pressure_loading_actuator'},
                {name: 'other', label:'Other'}],
      'other': [{name: 'other', label: 'Other'}]
    };

    var experimentTypes = {
      'atlss': [{name: 'hybrid_simulation', label:'Hybrid Simulation'},
                {name: 'other', label:'Other'}],
      'cgm-ucdavis':[{name: 'centrifuge', label:'Centrifuge'},
                {name: 'other', label:'Other'}],
      'eqss-utaustin':[{name: 'mobile_shaker', label:'Mobile Shaker'},
                {name: 'other', label:'Other'}],
      'pfsml-florida': [{name:'wind', label:'Wind'},
                {name: 'other', label:'Other'}],
      'wwhr-florida': [{name: 'wind', label:'Wind'},
                {name: 'other', label:'Other'}],
      'lhpost-sandiego': [{name: 'shake', label: 'Shake'},
                {name: 'other', label:'Other'}],
      'ohhwrl-oregon': [{name: 'wave', label:'Wave'},
                {name: 'other', label:'Other'}],
      'other': [{name: 'other', label:'Other'}]
    };

    var service = {};

    var projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    var dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
   //var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
   //var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);
    
    service.data = {
      navItems: [],
      projects: []
    };

    service.resolveParams = {
      projectId: null,
      filePath: null,
      projectTitle: null,
      query_string: null
    }

    /**
     * Get a list of Projects for the current user
     * @param {Object} options - The offset and limit variables
     * @returns {Project[]}
     */
    service.list = function(options) {
      return projectResource.get({params:options}).then(function(resp) {
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
      return collabResource.get({params: options}).then(function(resp){
        if (typeof resp.data.teamMembers !== 'undefined'){
          resp.data.teamMembers = _.without(resp.data.teamMembers, 'ds_admin', 'prjadmin');
        }
        return resp;
      });
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

    service.manageCategories = (options) => {
      $uibModal.open({
        component: 'manageCategories',
        resolve: {
          options: () => options,
        },
        size: 'lg'
      });
    };
        
    service.manageHybridSimulations = (options) => {
      $uibModal.open({
        component: 'manageHybridSimulations',
        resolve: {
          options: () => options,
        },
        size: 'lg'
      });
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @returns {Promise}
     */
    service.manageSimulations = (options) => {
      $uibModal.open({
        component: 'manageSimulations',
        resolve: {
          options: () => options,
        },
        size: 'lg'
      });
    };

    /**
    *
    * @param {FileListing} file
    * @return {Promise}
    */
    service.manageExperiments = (options) => {
      $uibModal.open({
        component: 'manageExperiments',
        resolve: {
          options: () => options,
          efs: () => efs,
          experimentTypes: () => experimentTypes,
          equipmentTypes: () => equipmentTypes,
        },
        size: 'lg'
      });
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @returns {Promise}
     */
    service.manageCollaborators = function(project) {
      var modal = $uibModal.open({
        template: require('../html/modals/project-service-add-collaborator.html'),
        controller: ['$scope', '$uibModalInstance', '$q', 'Django', 'UserService', function ($scope, $uibModalInstance, $q, Django, UserService) {
          $scope.data = {
            busy: true,
            project: project
          };

          $scope.initForm = function () {
            $scope.form = {
              curUsers: [],
              addUsers: [{}],
              curCoPis: [],
              addCoPis: [{}],
              authors:{}
            };
          };
          $scope.initForm();



          $scope.loadData = function () {
            var loads = [
              //projectResource.get({params: angular.copy(options)}),
              //service.get(angular.copy(options)),
              collabResource.get({params: {uuid: project.uuid}}),
            ];
            if (project.value.projectType === 'experimental'){
              loads.push(ProjectEntitiesService.listEntities(
                {uuid: project.uuid, name: 'designsafe.project.experiment'})
              );
            } else if (project.value.projectType === 'simulation'){
              loads.push(ProjectEntitiesService.listEntities(
                {uuid: project.uuid, name: 'designsafe.project.simulation'}));
            } else if (project.value.projectType === 'hybrid_simulation'){
              loads.push(ProjectEntitiesService.listEntities(
                {uuid: project.uuid, name: 'designsafe.project.hybrid_simulation'}));
            }
            $q.all(loads).then(function (results) {
              $scope.data.busy = false;
              if (results.length > 1){
                $scope.data.authored = results[1];
              }
              _.each($scope.data.authored, function(ent){
                $scope.form.authors[ent.uuid] = {};
                _.each(ent.value.authors, function(auth){
                    $scope.form.authors[ent.uuid][auth] = true;
              });
            });

            $scope.form.curUsers = _.map(results[0].data.teamMembers, function (collab) {
              return {
                user: {username: collab},
                remove: false
              };
            });
            $scope.form.curCoPis = _.map(results[0].data.coPis, function (collab) {
              return {
                user: {username: collab},
                remove: false
              };
            });
            }, function (error) {
              $scope.data.busy = false;
              $scope.data.error = error.data.message || error.data;
            });
          };

          $scope.loadData();

          $scope.canManage = function (user) {
            var noManage = $scope.data.project.value.pi === user ||
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


          $scope.authorship = [];

          $scope.toggleUserToEnt = function(ent, username){
            var add = $scope.form.authors[ent.uuid][username];
            $scope.authorship.push(ent);
            if (add){
                ent.value.authors.push(username);
            } else {
                ent.value.authors = _.filter(ent.value.authors, function (d) {
                  return d !== username;
                });
            }
          };

          $scope.saveCollaborators = function ($event) {
            if ($event) { $event.preventDefault();}
            $scope.data.busy = true;
            var raList = [];
            var rcpList = [];
            var aaList = [];
            var acpList = [];
            // Remove Users
            raList = _.map($scope.form.curUsers, function (cur) {
              if (cur.remove && cur.user.username) {
                return {username: cur.user.username, memberType: 'teamMember'};
              }
            });

            // Remove CoPI
            rcpList = _.map($scope.form.curCoPis, function(cur){
              if(cur.remove && cur.user.username){
                return {username: cur.user.username, memberType: 'coPi'};
              }
            });

            // Add Users
            aaList = _.map($scope.form.addUsers, function (add) {
              if (add.user && add.user.username) {
                return {username: add.user.username, memberType: 'teamMember'};
              }
            });

            // Add CoPi
            acpList = _.map($scope.form.addCoPis, function (add) {
              if (add.user && add.user.username) {
                return {username: add.user.username, memberType: 'coPi'};
              }
            });

            // Authorship
            var entsToUpdate = [];
            _.each($scope.authorship, function(obj){
              entsToUpdate.push(obj);
            });

            // TODO This should probably be a stack or something...
            // Or allow batch update of entities.
            var updateEnts = _.map(entsToUpdate, function(_ent){
              return ProjectEntitiesService.update({data: {
                  uuid: _ent.uuid,
                  entity: _ent
              }}).then(function(e){
                  var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                  ent.update(e);
                  return e;
              });
            });

            // Combine Requests
            
            // Process
            collabResource.delete({
                data: {
                  uuid: $scope.data.project.uuid,
                  users: _.compact(raList.concat(rcpList))
                }
            })
            .then(
              function(res){
                return collabResource.post({
                  data: {
                    uuid: $scope.data.project.uuid,
                    users: _.compact(aaList.concat(acpList))
                  }
                });
              },
              function(error){
                  $q.reject(error);
              }
            )
            .then(
              function(res){
                return $q.all(updateEnts);
              },
              function(error){
                  $q.reject(error);
              }
            )
            .then(
              function(res){
                $scope.data.busy = false;
                $scope.loadData();
                $scope.initForm();
              },
              function(error){
                $scope.data.busy = false;
                $scope.data.error = error;
                $scope.loadData();
                $scope.initForm();
              }
            );
          };

          $scope.cancel = function () {
            $uibModalInstance.close($scope.data.project);
          };
        }]
      });

      return modal.result;
    };

    
    /**
     * @param {Project} [project]
     * @return {Promise}
     */
    service.editProject = (project) => {
      $uibModal.open({
        component: 'editProject',
        resolve: {
          project: () => project,
          efs: () => efs,
        },
        size: 'lg'
      }).closed.then(function(){
        $state.reload();
      });
    };

    return service;

  }
