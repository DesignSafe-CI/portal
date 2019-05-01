import _ from 'underscore';
import { $IsStateFilter, $IncludedByStateFilter } from 'angular-ui-router/lib/stateFilters';

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
    };

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

    /**
     *
     * @param {Project} project The Project
     * @param {ProjectEntity} experiment The selected experiment/simulation/hybsim
     * @param {object} selections Object of file listings based on associated uuids
     * @returns {Message} Returns an error message to be displayed to the user
     */
    service.checkSelectedFiles = function(project, experiment, selections) {
      var errMsg = {
        modelconfig_set: 'Model Configuration',
        sensorlist_set: 'Sensor Information',
        event_set: 'Event',
        model_set: 'Model',
        input_set: 'Input',
        output_set: 'Output',
        globalmodel_set: 'Global Model',
        coordinator_set: 'Coordinator',
        simsubstructure_set: 'Simulation Substructure',
        expsubstructure_set: 'Experimental Substructure',
      };
      var requiredSets = [];
      var expSets = [];
      var selectedSets = [];
      var missingData = [];
      if (project.value.projectType === 'experimental') {
        requiredSets = ['modelconfig_set', 'sensorlist_set', 'event_set'];
      } else if (project.value.projectType === 'simulation') {
        requiredSets = ['model_set', 'input_set', 'output_set'];
      } else if (project.value.projectType === 'hybrid_simulation') {
        requiredSets = [
          'globalmodel_set',
          'coordinator_set',
          'simsubstructure_set',
          'expsubstructure_set',
        ];
      }

      requiredSets.forEach((set) => {
        project[set].forEach((s) => {
          if (s.associationIds.indexOf(experiment.uuid) > -1) {
            var data = {
              'type': set,
              'prjEnt': s
            };
            expSets.push(data);
          }
        });
      });
      expSets.forEach((set) => {
        if (Object.keys(selections).indexOf(set.prjEnt.uuid) > -1) {
          selectedSets.push(set.type);
        }
      });
      _.difference(requiredSets, selectedSets).forEach((ent) => {
        missingData.push(errMsg[ent]);
      });
      return missingData;
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

    service.manageProjectType = (options) => {
      $uibModal.open({
        component: 'manageProjectType',
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
      var modalInstance = $uibModal.open({
        component: 'manageExperiments',
        resolve: {
          options: () => options,
          efs: () => efs,
          experimentTypes: () => experimentTypes,
          equipmentTypes: () => equipmentTypes,
        },
        size: 'lg'
      });

      modalInstance.result.then((experiment) => {
        $state.reload();
      });
    };
    
    /**
     * @param {Project} [project]
     * @return {Promise}
     */
    service.editProject = (project) => {
      var modalInstance = $uibModal.open({
        component: 'editProject',
        resolve: {
          project: () => project,
          efs: () => efs,
        },
        size: 'lg'
      });
      return modalInstance;
    };

    
    return service;

  }
