(function(window, angular, _, undefined) {
  "use strict";

  var mod = angular.module('designsafe');
  mod.requires.push('django.context', 'httpi');

  mod.factory('ProjectService', ['httpi', '$interpolate', '$q', '$uibModal', 'Logging', 'ProjectModel', 'ProjectEntitiesService', function(httpi, $interpolate, $q, $uibModal, Logging, ProjectModel, ProjectEntitiesService) {

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

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @returns {Promise}
     */
    service.manageSimulations = function(options) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-manage-simulations.html',
        controller: ['$scope', '$uibModalInstance', '$q', 'Django', 'UserService', function ($scope, $uibModalInstance, $q, Django, UserService) {
          $scope.data = {
            busy: false,
            simulations: options.simulations,
            project: options.project,
            form: {}
          };
          $scope.ui = {
              simulations: {},
              updateSimulations: {},
              showAddSimReport: {},
              showAddSimAnalysis: {},
              showAddIntReport: {},
              showAddIntAnalysis: {}
              };
          $scope.ui.simulationTypes = [
            {
              name: 'Geotechnical',
              label: 'Geotechnical'},
            { name: 'Structural',
              label: 'Structural'},
            { name: 'Soil Structure System',
              label: 'Soil Structure System'},
            { name: 'Storm Surge',
              label: 'Storm Surge'},
            { name: 'Wind',
              label: 'Wind'},
            { name: 'Other',
              label: 'Other'}
          ];
          $scope.form = {
            curSimulation: [],
            addSimulation: [{}],
            deleteSimulations: [],
            entitiesToAdd:[]
          };

          $scope.filterProjectOnlyRelatedAnalysis = function(analysis){
            return _.filter(analysis, function(anl){
              return !anl.value.simOutputs.length && !anl.value.simulations.length;
            });
          };

          $scope.saveSimulation = function($event){
            $event.preventDefault();
            $scope.data.busy = true;
            var simulation = $scope.form.addSimulation[0];
            if (_.isEmpty(simulation.title) || typeof simulation.title === 'undefined' ||
                _.isEmpty(simulation.simulationType) || typeof simulation.simulationType === 'undefined'){
                $scope.data.error = 'Title and Type are required.';
                $scope.data.busy = false;
                return;
            }
            simulation.description = simulation.description || '';
            ProjectEntitiesService.create({
              data: {
                  uuid: $scope.data.project.uuid,
                  name: 'designsafe.project.simulation',
                  entity: simulation
              }
            }).then(function(res){
                $scope.data.project.addEntity(res);
            }).then(function(){
                $scope.data.busy = false;
                $scope.ui.showAddSimulationForm = false;
                $scope.form.addSimulation = [{}];
            });
          };

          $scope.form.curExperiments = $scope.data.project.experiment_set;

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
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

          $scope.editSim = function(sim){
            $scope.editSimForm = {
                sim: sim,
                description: sim.value.description,
                simulationType: sim.value.simulationType,
                simulationTypeOther: sim.value.simulationTypeOther,
                title: sim.value.title,
            };
            $scope.ui.showEditSimulationForm = true;
          };


          $scope.moveOrderUp = function($index, ent, list){
            if (typeof ent._ui.order === 'undefined'){
              ent._ui.order = 0;
            } else if (ent._ui.order > 0){
              var order = ent._ui.order;
              var _ent = _.find(list, function(e){
                                            return e._ui.order === order - 1; });
              ent._ui.order -= 1;
              _ent._ui.order += 1;
            }
          };

          $scope.moveOrderDown = function($index, ent, list){
            if (typeof ent._ui.order === 'undefined'){
              ent._ui.order = 0;
            } else if (ent._ui.order < list.length - 1){
              var _ent = _.find(list, function(e){
                                            return e._ui.order === ent._ui.order + 1; });
              ent._ui.order += 1;
              _ent._ui.order -= 1;
            }
          };

          $scope.saveEditSimulation = function(){
              var sim = $scope.editSimForm.sim;
              sim.value.title = $scope.editSimForm.title;
              sim.value.description = $scope.editSimForm.description;
              sim.value.simulationType = $scope.editSimForm.simulationType;
              sim.value.simulationTypeOther = $scope.editSimForm.simulationTypeOther;
              $scope.ui.savingEditSim = true;
              ProjectEntitiesService.update({data: {
                  uuid: sim.uuid,
                  entity: sim
              }}).then(function(e){
                  var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                  ent.update(e);
                  $scope.ui.savingEditExp = false;
                  $scope.data.simulations = $scope.data.project.simulations_set;
                  $scope.ui.showEditSimulationForm = false;
                  return e;
              });
          };

          $scope.toggleDeleteSimulation = function(uuid){
            if (uuid in $scope.ui.simulations &&
                $scope.ui.simulations[uuid].deleted){
              var index = $scope.form.deleteSimulations.indexOf(uuid);
              $scope.form.deleteSimulations.splice(index, 1);
              $scope.ui.simulations[uuid].deleted = false;
            } else {
              $scope.form.deleteSimulations.push(uuid);
              $scope.ui.simulations[uuid] = {};
              $scope.ui.simulations[uuid].deleted = true;
            }
          };

          $scope.removeSimulations = function($event){
            $scope.data.busy = true;

            var removeActions = _.map($scope.form.deleteSimulations, function(uuid){
              return ProjectEntitiesService.delete({
                data: {
                  uuid: uuid,
                }
              }).then(function(entity){
                var entityAttr = $scope.data.project.getRelatedAttrName(entity.name);
                var entitiesArray = $scope.data.project[entityAttr];
                entitiesArray = _.filter(entitiesArray, function(e){
                        return e.uuid !== entity.uuid;
                    });
                $scope.data.project[entityAttr] = entitiesArray;
                $scope.data.simulations = $scope.data.project[entityAttr];
              });
            });

            $q.all(removeActions).then(
              function (results) {
                $scope.data.busy = false;
                $scope.form.addExperiments = [{}];
                //$uibModalInstance.close(results);
              },
              function (error) {
                $scope.data.busy = false;
                $scope.data.error = error;
                //$uibModalInstance.reject(error.data);
              }
            );

          };

          $scope.removeAnalysis = function(uuid){
            $scope.data.busy = true;
            ProjectEntitiesService.delete({
              data: {
                uuid: uuid,
              }
            }).then(function(entity){
                var entityAttr = $scope.data.project.getRelatedAttrName(entity.name);
                var entitiesArray = $scope.data.project[entityAttr];
                entitiesArray = _.filter(entitiesArray, function(e){
                        return e.uuid !== entity.uuid;
                    });
                $scope.data.project[entityAttr] = entitiesArray;
                $scope.data.busy = false;
            },
            function(error){
                $scope.data.busy = false;
              $scope.data.error = error;
            });
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
              $scope.form.updateExperiments = {};
            },
            function(err){
              $uibModalInstance.reject(err.data);
            });
          };
          $scope.ui.addingTag = false;
          if ($scope.data.project.value.projectType === 'experimental'){
            $scope.ui.tagTypes = [
                {label: 'Model Config',
                 name: 'designsafe.project.model_config',
                 yamzId: 'h1312'},
                {label: 'Sensor Info',
                 name: 'designsafe.project.sensor_list',
                 yamzId: 'h1557'},
                {label: 'Event',
                 name: 'designsafe.project.event',
                 yamzId: 'h1253'},
                {label: 'Analysis',
                 name: 'designsafe.project.analysis',
                 yamzId: 'h1333'},
                {label: 'Report',
                 name: 'designsafe.project.report',
                 yamzId: ''}
                ];
          } else if ($scope.data.project.value.projectType === 'simulation'){
            $scope.ui.tagTypes = [
                {label: 'Simulation Model',
                 name: 'designsafe.project.simulation.model',
                 yamzId: ''},
                {label: 'Simulation Input',
                 name: 'designsafe.project.simulation.input',
                 yamzId: ''},
                {label: 'Simulation Output',
                 name: 'designsafe.project.simulation.output',
                 yamzId: ''},
                 {label: 'Integrated Data Analysis',
                  name: 'designsafe.project.simulation.analysis',
                  yamzId: ''},
                 {label: 'Integrated Report',
                  name: 'designsafe.project.simulation.report',
                  yamzId: ''},
                 {label: 'Analysis',
                 name: 'designsafe.project.analysis',
                 yamzId: 'h1333'},
                {label: 'Report',
                 name: 'designsafe.project.report',
                 yamzId: ''},
                ];
          }
          $scope.ui.simModel = {};
          $scope.ui.simModel.apps = [
            {label: 'ADDCIRC',
             name: 'ADDCIRC',
             yamzId: '' },
            {label: 'Abaqus',
             name: 'Abaqus',
             yamzId: ''},
            {label: 'Atena',
             name: 'Atena',
             yamzId: ''},
            {label: 'ClawPack/GeoClaw',
             name: 'ClawPack/GeoClaw',
             yamzId: ''},
            {label: 'Diana',
             name: 'Diana',
             yamzId: ''},
            {label: 'ETABS',
             name: 'ETABS',
             yamzId: ''},
            {label: 'FUNWAVE',
             name: 'FUNWAVE',
             yamzId: ''},
            {label: 'FLUENT/ANSYS',
             name: 'FLUENT/ANSYS',
             yamzId: ''},
            {label: 'LS-Dyna',
             name: 'LS-Dyna',
             yamzId: ''},
            {label: 'OpenFoam',
             name: 'OpenFoam',
             yamzId: ''},
            {label: 'OpenSees',
             name: 'OpenSees',
             yamzId: ''},
            {label: 'PERFORM',
             name: 'PERFORM',
             yamzId: ''},
            {label: 'SAP',
             name: 'SAP',
             yamzId: ''},
            {label: 'SWAN',
             name: 'SWAN',
             yamzId: ''},
            {label: 'Other',
             name: 'Other',
             yamzId: ''},
          ];
          $scope.ui.simModel.NHType = [
            {label: 'Earthquake',
             name: 'Earthquake',
             yamzId: '' },
            {label: 'Flood',
             name: 'Flood',
             yamzId: '' },
            {label: 'Landslide',
             name: 'Landslide',
             yamzId: '' },
            {label: 'Tornado',
             name: 'Tornado',
             yamzId: '' },
            {label: 'Tsunami',
             name: 'Tsunami',
             yamzId: '' },
            {label: 'Other',
             name: 'Other',
             yamzId: '' },
          ];
          $scope.data.form.projectTagToAdd = {optional:{}};

          $scope.addProjectTag = function(){
            var entity = $scope.data.form.projectTagToAdd;
            var nameComps = entity.name.split('.');
            var name = nameComps[nameComps.length-1];
            $scope.ui.addingTag = true;
            entity.description = entity.description || '';
            if (typeof $scope.data.files !== 'undefined'){
              entity.filePaths = _.map($scope.data.files,
                                     function(file){
                                      return file.path;
                                     });
            }
            $scope.ui.addingTag = true;
            ProjectEntitiesService.create({data: {
                uuid: $scope.data.project.uuid,
                name: entity.name,
                entity: entity
            }})
            .then(
               function(resp){
                 $scope.data.form.projectTagToAdd = {optional:{}};
                 //currentState.project.addEntity(resp);
                 $scope.data.project.addEntity(resp);
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
              equipmentTypes: equipmentTypes,
              updateExperiments: {},
              showAddReport: {}
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

          $scope.editExp = function(exp){
            $scope.editExpForm = {
                exp: exp,
                title: exp.value.title,
                facility: exp.getEF($scope.data.project.value.projectType,
                                    exp.value.experimentalFacility).label,
                type: exp.value.experimentType,
                equipment: exp.getET(exp.value.experimentalFacility,
                                        exp.value.equipmentType).label,
                description: exp.value.description
            };
            $scope.ui.showEditExperimentForm = true;
          };


          $scope.moveOrderUp = function($index, ent, list){
            if (typeof ent._ui.order === 'undefined'){
              ent._ui.order = 0;
            } else if (ent._ui.order > 0){
              var order = ent._ui.order;
              var _ent = _.find(list, function(e){
                                            return e._ui.order === order - 1; });
              ent._ui.order -= 1;
              _ent._ui.order += 1;
            }
          };

          $scope.moveOrderDown = function($index, ent, list){
            if (typeof ent._ui.order === 'undefined'){
              ent._ui.order = 0;
            } else if (ent._ui.order < list.length - 1){
              var _ent = _.find(list, function(e){
                                            return e._ui.order === ent._ui.order + 1; });
              ent._ui.order += 1;
              _ent._ui.order -= 1;
            }
          };

          $scope.saveEditExperiment = function(){
              var exp = $scope.editExpForm.exp;
              exp.value.title = $scope.editExpForm.title;
              exp.value.description = $scope.editExpForm.description;
              $scope.ui.savingEditExp = true;
              ProjectEntitiesService.update({data: {
                  uuid: exp.uuid,
                  entity: exp
              }}).then(function(e){
                  var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                  ent.update(e);
                  $scope.ui.savingEditExp = false;
                  $scope.data.experiments = $scope.data.project.experiment_set;
                  $scope.ui.showEditExperimentForm = false;
                  return e;
              });
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
              exp.description = exp.description || '';
              if (exp.title && exp.experimentalFacility && exp.experimentType){
                return ProjectEntitiesService.create({
                  data: {
                    uuid: $scope.data.project.uuid,
                    name: 'designsafe.project.experiment',
                    entity: exp
                  }
                }).then(function(res){
                  $scope.data.project.addEntity(res);
                  //$scope.data.experiments.push(res);
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
            $scope.data.busy = true;

            var removeActions = _.map($scope.form.deleteExperiments, function(uuid){
              return ProjectEntitiesService.delete({
                data: {
                  uuid: uuid,
                }
              }).then(function(entity){
                var entityAttr = $scope.data.project.getRelatedAttrName(entity.name);
                var entitiesArray = $scope.data.project[entityAttr];
                entitiesArray = _.filter(entitiesArray, function(e){
                        return e.uuid !== entity.uuid;
                    });
                $scope.data.project[entityAttr] = entitiesArray;
                $scope.data.experiments = $scope.data.project[entityAttr];
              });
            });

            $q.all(removeActions).then(
              function (results) {
                $scope.data.busy = false;
                $scope.form.addExperiments = [{}];
                //$uibModalInstance.close(results);
              },
              function (error) {
                $scope.data.busy = false;
                $scope.data.error = error;
                //$uibModalInstance.reject(error.data);
              }
            );

          };

          $scope.removeAnalysis = function(uuid){
            $scope.data.busy = true;
            ProjectEntitiesService.delete({
              data: {
                uuid: uuid,
              }
            }).then(function(entity){
                var entityAttr = $scope.data.project.getRelatedAttrName(entity.name);
                var entitiesArray = $scope.data.project[entityAttr];
                entitiesArray = _.filter(entitiesArray, function(e){
                        return e.uuid !== entity.uuid;
                    });
                $scope.data.project[entityAttr] = entitiesArray;
                $scope.data.busy = false;
            },
            function(error){
                $scope.data.busy = false;
              $scope.data.error = error;
            });
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
              $scope.form.updateExperiments = {};
            },
            function(err){
              $uibModalInstance.reject(err.data);
            });
          };

          $scope.ui.addingTag = false;
          if ($scope.data.project.value.projectType === 'experimental'){
            $scope.ui.tagTypes = [
                {label: 'Model Config',
                 name: 'designsafe.project.model_config',
                 yamzId: 'h1312'},
                {label: 'Sensor Info',
                 name: 'designsafe.project.sensor_list',
                 yamzId: 'h1557'},
                {label: 'Event',
                 name: 'designsafe.project.event',
                 yamzId: 'h1253'},
                {label: 'Analysis',
                 name: 'designsafe.project.analysis',
                 yamzId: 'h1333'},
                {label: 'Report',
                 name: 'designsafe.project.report',
                 yamzId: ''}
                ];
          } else if ($scope.data.project.value.projectType === 'simulation'){
            $scope.ui.tagTypes = [
                {label: 'Simulation Model',
                 name: 'designsafe.project.simulation.model',
                 yamzId: ''},
                {label: 'Simulation Input',
                 name: 'designsafe.project.simulation.input',
                 yamzId: ''},
                {label: 'Simulation Output',
                 name: 'designsafe.project.simulation.output',
                 yamzId: ''},
                {label: 'Analysis',
                 name: 'designsafe.project.simulation.analysis',
                 yamzId: 'h1333'},
                {label: 'Report',
                 name: 'designsafe.project.simulation.report',
                 yamzId: ''}
                ];
          }
          $scope.ui.simModel = {};
          $scope.ui.simModel.apps = [
            {label: 'ADDCIRC',
             name: 'ADDCIRC',
             yamzId: '' },
            {label: 'Abaqus',
             name: 'Abaqus',
             yamzId: ''},
            {label: 'Atena',
             name: 'Atena',
             yamzId: ''},
            {label: 'ClawPack/GeoClaw',
             name: 'ClawPack/GeoClaw',
             yamzId: ''},
            {label: 'Diana',
             name: 'Diana',
             yamzId: ''},
            {label: 'ETABS',
             name: 'ETABS',
             yamzId: ''},
            {label: 'FUNWAVE',
             name: 'FUNWAVE',
             yamzId: ''},
            {label: 'FLUENT/ANSYS',
             name: 'FLUENT/ANSYS',
             yamzId: ''},
            {label: 'LS-Dyna',
             name: 'LS-Dyna',
             yamzId: ''},
            {label: 'OpenFoam',
             name: 'OpenFoam',
             yamzId: ''},
            {label: 'OpenSees',
             name: 'OpenSees',
             yamzId: ''},
            {label: 'PERFORM',
             name: 'PERFORM',
             yamzId: ''},
            {label: 'SAP',
             name: 'SAP',
             yamzId: ''},
            {label: 'SWAN',
             name: 'SWAN',
             yamzId: ''},
            {label: 'Other',
             name: 'Other',
             yamzId: ''},
          ];
          $scope.ui.simModel.NHType = [
            {label: 'Earthquake',
             name: 'Earthquake',
             yamzId: '' },
            {label: 'Flood',
             name: 'Flood',
             yamzId: '' },
            {label: 'Landslide',
             name: 'Landslide',
             yamzId: '' },
            {label: 'Tornado',
             name: 'Tornado',
             yamzId: '' },
            {label: 'Tsunami',
             name: 'Tsunami',
             yamzId: '' },
            {label: 'Other',
             name: 'Other',
             yamzId: '' },
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
            entity.description = newTag.tagDescription || '';
            if (typeof $scope.data.files !== 'undefined'){
              entity.filePaths = _.map($scope.data.files,
                                     function(file){
                                      return file.path;
                                     });
            }
            $scope.ui.addingTag = true;
            ProjectEntitiesService.create({data: {
                uuid: $scope.data.project.uuid,
                name: newTag.tagType,
                entity: entity
            }})
            .then(
               function(resp){
                 $scope.data.form.projectTagToAdd = {optional:{}};
                 //currentState.project.addEntity(resp);
                 $scope.data.project.addEntity(resp);
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
    service.manageCollaborators = function(project) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/project-service-add-collaborator.html',
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
              // removing project type options until they are supported
              // id: 'hybrid_simulation',
              // label: 'Hybrid Simulation'},{
              // id: 'field_reconnaissance',
              // label: 'Field Reconnaissance'}, {
              id: 'other',
              label: 'Other'}];
          $scope.efs = efs;

          if (project) {
            $scope.form.uuid = project.uuid;
            $scope.form.title = project.value.title;
            $scope.form.awardNumber = project.value.awardNumber || '';
            $scope.form.projectId = project.value.projectId || '';
            $scope.form.description = project.value.description || '';
            $scope.form.experimentalFacility = project.value.experimentalFacility || '';
            $scope.form.keywords = project.value.keywords || '';
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
              projectId: $scope.form.projectId
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
            if ($scope.form.uuid && $scope.form.uuid) {
              projectData.uuid = $scope.form.uuid;
            }
            if (typeof $scope.form.associatedProjectsAdded !== 'undefined'){
               $scope.form.associatedProjectsAdded = _.filter($scope.form.associatedProjectsAdded, function(associatedProject){ return typeof associatedProject.title !== 'undefined' && associatedProject.title.length > 0; });
               projectData.associatedProjects = $scope.form.associatedProjects || [];
               projectData.associatedProjects = _.filter(projectData.associatedProjects, function(associatedProject){ return !associatedProject.delete; });
               projectData.associatedProjects = projectData.associatedProjects.concat($scope.form.associatedProjectsAdded);
            }
            if (typeof $scope.form.keywords !== 'undefined'){
              projectData.keywords = $scope.form.keywords;
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
