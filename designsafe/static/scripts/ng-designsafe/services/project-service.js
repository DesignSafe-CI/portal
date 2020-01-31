import _ from 'underscore';
import { $IsStateFilter, $IncludedByStateFilter } from 'angular-ui-router/lib/stateFilters';
import experimentalData from "../../projects/components/manage-experiments/experimental-data.json";

export function ProjectService(httpi, $interpolate, $q, $state, $uibModal, Logging, ProjectModel, ProjectEntitiesService) {
    'ngInject';

    let logger = Logging.getLogger('DataDepot.ProjectService');

    let efs = experimentalData.experimentalFacility;
    let equipmentTypes = experimentalData.equipmentTypes;
    let experimentTypes = experimentalData.experimentTypes;

    let service = {};

    let projectResource = httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    let collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
    let dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
    //var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
    //var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);

    service.data = {
        navItems: [],
        projects: [],
    };

    service.resolveParams = {
        projectId: null,
        filePath: null,
        projectTitle: null,
        query_string: null,
    };

    /**
     * Get a list of Projects for the current user
     * @param {Object} options - The offset and limit variables
     * @returns {Project[]}
     */
    service.list = function(options) {
        return projectResource.get({ params: options }).then(function(resp) {
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
        return projectResource.get({ params: options }).then(function(resp) {
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
        return projectResource.post({ data: options }).then(function(resp) {
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
        return collabResource.get({ params: options }).then(function(resp) {
            if (typeof resp.data.teamMembers !== 'undefined') {
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
        return collabResource.post({ data: options });
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {Promise}
     */
    service.removeCollaborator = function(options) {
        return collabResource.delete({ data: options });
    };

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} [options.fileId] the Project data file id to list
     * @returns {Promise}
     */
    service.projectData = function(options) {
        return dataResource.get({ params: options });
    };

    /**
     *
     * @param {Project} project The Project
     * @param {ProjectEntity} selPrimEnts The selected primary entities
     * @param {object} selFileListings Object of selected file listings based on associated uuids
     * @returns {Message} Returns an error message for missing or incomplete entities
     */
    service.checkSelectedFiles = function(project, selPrimEnts, selFileListings) {
        let missingData = [];
        let errMsg = {
            experiment: 'Experiment',
            model_config: 'Model Configuration',
            sensor_list: 'Sensor Information',
            event: 'Event',
            simulation: 'Simulation',
            model: 'Model',
            input: 'Input',
            output: 'Output',
            hybrid_simulation: 'Hybrid Simulation',
            global_model: 'Global Model',
            coordinator: 'Coordinator',
            sim_substructure: 'Simulation Substructure',
            exp_substructure: 'Experimental Substructure',
            mission: 'Mission',
            collection: 'Collection',
            planning: 'Research Planning Collection',
            social_science: 'Social Sciences Collection',
            geoscience: 'Engineering/Geosciences Collection',
            analysis: 'Analysis',
            report: 'Report',
        };

        let checkEntityHasFiles = (e) => {
            if (!selFileListings[e.uuid]) {
                return false;
            }
            return true;
        };
        
        let addMissing = (missingEnt, fields) => {
            if (!fields){
                missingData.push({
                    'title': missingEnt.value.title,
                    'missing': ['Associated files/data are missing or not selected'],
                    'type': errMsg[missingEnt.name.split('.').pop()]
                });
            } else {
                let readableFields = fields.map(f => errMsg[f]);
                missingData.push({
                    'title': missingEnt.value.title,
                    'missing': readableFields,
                    'type': errMsg[missingEnt.name.split('.').pop()]
                });
            }
        };

        let checkRequirements = (set, subsets, required) => {
            if (!subsets && !required) {
                set.forEach((s) => {
                    if (!checkEntityHasFiles(s)) {
                        addMissing(s);
                    }
                });
            } else {
                set.forEach((s) => {
                    let related =  subsets.filter(subset => subset.associationIds.includes(s.uuid));
                    let checklist = [];

                    related.forEach((relEnt) => {
                        if (!checkEntityHasFiles(relEnt)) {
                            addMissing(relEnt);
                        } else if (!checklist.includes(relEnt.name.split('.').pop())) {
                            checklist.push(relEnt.name.split('.').pop());
                        }
                    });
                    let missing = required.filter(req => !checklist.includes(req));
                    if (missing.length) {
                        addMissing(s, missing);
                    }
                });
            }
        };

        if (project.value.projectType === 'experimental') {
            /* 
            Experimental Requirements:
            Condition 1)
                + If an Experiment is published it must have:
                    - Model Configuration Set
                    - Sensor Inf. Set
                    - Event Set
                + Sets must include categorized files
            */
            let requirements = ['model_config', 'sensor_list', 'event'];
            let subentities = [].concat(
                project.modelconfig_set || [],
                project.sensorlist_set || [],
                project.event_set || []
            );
            let experiments = selPrimEnts.filter(ent => ent.name.endsWith('experiment'));
            // let reports = selPrimEnts.filter(ent => ent.name.endsWith('report'));
            if (experiments.length) {
                checkRequirements(experiments, subentities, requirements);
            }
        } else if (project.value.projectType === 'simulation') {
            /* 
            Simulation Requirements:
            Condition 1)
                + If a Simulation is published it must have:
                    - Model Set
                    - Input Set
                    - Output Set
                + Sets must include categorized files
            */
            let requirements = ['model', 'input', 'output'];
            let subentities = [].concat(
                project.model_set || [],
                project.input_set || [],
                project.output_set || []
            );
            let simulations = selPrimEnts.filter(ent => ent.name.endsWith('simulation'));
            // let reports = selPrimEnts.filter(ent => ent.name.endsWith('report'));
            if (simulations.length) {
                checkRequirements(simulations, subentities, requirements);
            }
        } else if (project.value.projectType === 'hybrid_simulation') {
            /* 
            Hybrid Simulation Requirements:
            Condition 1)
                + If a Hybrid Simulation is published it must have:
                    - Global Model Set
                    - Coordinator Set
                    - Simulation Substructure Set
                    - Experimental Substructure Set
                + Sets must include categorized files
            */
            let requirements = ['global_model', 'coordinator', 'sim_substructure', 'exp_substructure'];
            let subentities = [].concat(
                project.globalmodel_set || [],
                project.coordinator_set || [],
                project.simsubstructure_set || [],
                project.expsubstructure_set || []
            );
            let hybSimulations = selPrimEnts.filter(ent => ent.name.endsWith('hybrid_simulation'));
            // let reports = selPrimEnts.filter(ent => ent.name.endsWith('report'));
            if (hybSimulations.length) {
                checkRequirements(hybSimulations, subentities, requirements);
            }
        } else if (project.value.projectType === 'field_recon') {
            /* 
            Field Research Requirements:
            Condition 1)
                + A report may be published alone and must have:
                    - Files associated to the Report

            Condition 2)
                + If a mission is published it must have:
                    - Planning Set
                    - Social Science OR Geoscience Set
                    - Files within all Sets
            */
            let requirements = ['planning', 'social_science', 'geoscience'];
            let missions = selPrimEnts.filter(ent => ent.name.endsWith('mission'));
            let reports = selPrimEnts.filter(ent => ent.name.endsWith('report'));
            let subentities = [].concat(
                project.planning_set || [],
                project.socialscience_set || [],
                project.geoscience_set || []
            );
            
            if (missions.length) {
                checkRequirements(missions, subentities, requirements);
                // if a mission is missing only a social science or geoscience model this is okay
                missingData = missingData.filter((data) => {
                    if (data.missing.length < 2 && (data.missing.includes('Social Sciences Collection') || data.missing.includes('Engineering/Geosciences Collection'))) {
                        return false;
                    }
                    return true;
                });
            }
            if (reports.length) {
                checkRequirements(reports);
            }
        }
        return missingData;
    };

    service.manageHybridSimulations = (options) => {
        $uibModal.open({
            component: 'manageHybridSimulations',
            resolve: {
                options: () => options,
            },
            size: 'lg',
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
            size: 'lg',
        });
    };

    /**
     * @param {Project} [project]
     * @return {Promise}
     */
    service.editProject = (project) => {
        let modalInstance = $uibModal.open({
            component: 'editProject',
            resolve: {
                project: () => project,
                efs: () => efs,
            },
            size: 'lg',
        });
        return modalInstance;
    };


    return service;

}
