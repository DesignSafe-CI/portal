import { from } from 'rxjs';
import { map, tap, concatMap, take } from 'rxjs/operators';
import { takeLeadingSubscriber, takeLatestSubscriber } from './_rxjs-utils';
import experimentalData from '../../projects/components/manage-experiments/experimental-data.json';

export class ProjectService {
    constructor(
        httpi,
        $http,
        $interpolate,
        $q,
        $state,
        $uibModal,
        ProjectModel,
        UserService,
    ) {
        'ngInject';
        this.httpi = httpi;
        this.$http = $http;
        this.$interpolate = $interpolate;
        this.$q = $q;
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.ProjectModel = ProjectModel;
        this.UserService = UserService;

        this.efs = experimentalData.experimentalFacility;
        this.equipmentTypes = experimentalData.equipmentTypes;
        this.experimentTypes = experimentalData.experimentTypes;

        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
        this.dataResource = this.httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
        this.notificationResource = httpi.resource('/api/projects/:uuid/notification/').setKeepTrailingSlash(true);

        this.data = {
            navItems: [],
            projects: [],
        };

        this.resolveParams = {
            projectId: null,
            filePath: null,
            projectTitle: null,
            query_string: null,
        };

        this.listings = {
            main: {
                projects: [],
                loading: false,
                loadingScroll: false,
                params: { section: 'main', offset: 0, limit: 100 },
                reachedEnd: true,
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
            },
            modal: {
                projects: [],
                loading: false,
                loadingScroll: false,
                params: { section: 'main', offset: 0, limit: 100 },
                reachedEnd: true,
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
            },
        };

        // Latest project retrieved by this.get
        this.current = null;

        this.getPiNames = this.getPiNames.bind(this);
    }

    /**
     * Get a list of Projects for the current user
     * @param {Object} options - The offset and limit variables
     * @returns {Project[]}
     */
    list({ offset, limit }) {
        return this.projectResource.get({ params: { offset, limit } }).then((resp) => {
            return resp.data.projects.map((p) => {
                return new this.ProjectModel(p);
            });
        });
    }

    getPiNames(projectList) {
        const piList = [...new Set(projectList.map((p) => p.value.pi))];
        const usernameMapping = {};
        const piPromise = this.UserService.getPublic(piList).then((resp) => {
            var data = resp.userData;
            data.forEach((user) => {
                usernameMapping[user.username] = user.fname + ' ' + user.lname;
            });
            projectList.forEach((p) => {
                p._pi_name = usernameMapping[p.value.pi];
            });
            return projectList;
        });
        return from(piPromise);
    }

    listProjects({ section, offset, limit, query_string }) {
        this.listings[section].params = {
            ...this.listings[section].params,
            offset: offset || 0,
            limit: limit || 100,
            query_string,
        };
        this.listings[section].loading = true;
        const observableMapping = () =>
            this.mapParamsToListing({ section, offset: offset || 0, limit: limit || 100, query_string });
        this.listings[section].listingSubscriber.next(observableMapping);
        return this.listings[section].listingSubscriber.pipe(take(1)).toPromise();
    }
    mapParamsToListing({ section, offset, limit, query_string }) {
        const listingParams = { section, offset: offset || 0, limit: limit || 100, query_string };
        const listingObservable$ = from(this.$http.get('/api/projects/', { params: listingParams })).pipe(
            map((resp) => resp.data.projects.map((p) => new this.ProjectModel(p))),
            concatMap(this.getPiNames),
            tap(this.listingSuccessCallback(section))
        );
        return listingObservable$;
    }
    listingSuccessCallback(section) {
        return (projects) => {
            this.listings[section].projects = projects;
            this.listings[section].loading = false;
            this.listings[section].reachedEnd = projects.length < this.listings[section].params.limit;
        };
    }

    scrollProjects({ section }) {
        const scrollParams = {
            offset: this.listings[section].params.offset + this.listings[section].params.limit,
            limit: this.listings[section].params.limit,
            query_string: this.listings[section].params.query_string,
            section,
        };

        this.listings[section].loadingScroll = true;
        const observableMapping = () => this.mapParamsToScroll(scrollParams);
        this.listings[section].scrollSubscriber.next(observableMapping);
    }
    mapParamsToScroll({ section, offset, limit, query_string }) {
        this.listings[section].params = { ...this.listings[section].params, offset, limit };
        const scrollObservable$ = from(
            this.$http.get('/api/projects/', { params: { offset, limit, query_string } })
        ).pipe(
            map((resp) => resp.data.projects.map((p) => new this.ProjectModel(p))),
            concatMap(this.getPiNames),
            tap(this.scrollSuccessCallback(section))
        );
        return scrollObservable$;
    }
    scrollSuccessCallback(section) {
        return (projects) => {
            this.listings[section].projects = [...this.listings[section].projects, ...projects];
            this.listings[section].loadingScroll = false;
            this.listings[section].reachedEnd = projects.length < this.listings[section].params.limit;
        };
    }

    /**
     * Get a specific Project
     * @param {Object} options
     * @param {string} options.uuid The Project UUID
     * @returns {Promise}
     */
    get(options) {
        return this.projectResource.get({ params: options }).then((resp) => {
            const prj = new this.ProjectModel(resp.data);
            this.current = prj;
            return prj;
        });
    }

    /**
     * Save or update a Project
     * @param {Object} options
     * @param {string} [options.uuid] The Project uuid, if updating existing record, otherwise null
     * @param {string} options.title The Project title
     * @param {string} [options.pi] The username for Project PI
     * @param {string[]} [options.coPis] List of usernames for Project Co-PIs
     * @returns {Promise}
     */
    save(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            this.current = null;
            return new this.ProjectModel(resp.data);
        });
    }

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} [options.fileId] the Project data file id to list
     * @returns {Promise}
     */
    projectData(options) {
        return this.dataResource.get({ params: options });
    }

    /**
     *
     * @param {Project} project The Project
     * @param {ProjectEntity} selPrimEnts The selected primary entities
     * @param {object} selFileListings Object of selected file listings based on associated uuids
     * @returns {Message} Returns an error message for missing or incomplete entities
     */
    checkSelectedFiles(project, selPrimEnts, selFileListings) {
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
            if (!selFileListings[e.uuid].listing.length) {
                return false;
            }
            return true;
        };

        let addMissing = (missingEnt, fields) => {
            if (!fields) {
                missingData.push({
                    title: missingEnt.value.title,
                    missing: ['Associated files/data are missing or not selected'],
                    type: errMsg[missingEnt.name.split('.').pop()],
                });
            } else {
                let readableFields = fields.map((f) => errMsg[f]);
                missingData.push({
                    title: missingEnt.value.title,
                    missing: readableFields,
                    type: errMsg[missingEnt.name.split('.').pop()],
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
                    let related = subsets.filter((subset) => subset.associationIds.includes(s.uuid));
                    let checklist = [];

                    related.forEach((relEnt) => {
                        if (!checkEntityHasFiles(relEnt)) {
                            addMissing(relEnt);
                        } else if (!checklist.includes(relEnt.name.split('.').pop())) {
                            checklist.push(relEnt.name.split('.').pop());
                        }
                    });
                    let missing = required.filter((req) => !checklist.includes(req));
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
            let experiments = selPrimEnts.filter((ent) => ent.name.endsWith('experiment'));
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
            let subentities = [].concat(project.model_set || [], project.input_set || [], project.output_set || []);
            let simulations = selPrimEnts.filter((ent) => ent.name.endsWith('simulation'));
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
            let hybSimulations = selPrimEnts.filter((ent) => ent.name.endsWith('hybrid_simulation'));
            // let reports = selPrimEnts.filter(ent => ent.name.endsWith('report'));
            if (hybSimulations.length) {
                checkRequirements(hybSimulations, subentities, requirements);
            }
        } else if (project.value.projectType === 'field_recon') {
            /* 
            Field Research Requirements:
            Condition 1)
                + A Mission or Documents may be published alone
                + Missions must have at least one Collection of any type
                    - Collections must have at least one categorized file
                + Documents (defined as 'reports' in metadata) must have
                  at least one categorized file
            
            Since FR is the only model which will require just one of multiple requirement
            types we will check for missing information first and then check that one of
            the requirements is included.
            */
            let requirements = ['planning', 'social_science', 'geoscience'];
            let missions = selPrimEnts.filter((ent) => ent.name.endsWith('mission'));
            let reports = selPrimEnts.filter((ent) => ent.name.endsWith('report'));
            let subentities = [].concat(
                project.planning_set || [],
                project.socialscience_set || [],
                project.geoscience_set || []
            );

            if (missions.length) {
                checkRequirements(missions, subentities, requirements);
                let errNames = Array.from(requirements, (req) => errMsg[req]);
                // ensure all requirements are not missing (we just need one for FR) and
                // there are no missing files
                missingData = missingData.filter((data) => {
                    if (
                        !errNames.every((name) => data.missing.includes(name)) &&
                        !data.missing.includes('Associated files/data are missing or not selected')
                    ) {
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
    }

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {Promise}
     */
    notifyPersonalData(options) {
        return notificationResource.post({ data: options });
    }

    /**
     *
     * @param options
     * @param {string} options.uuid The Project uuid
     * @param {string} options.username The username of the collaborator to add
     * @returns {Promise}
     */
    notifyPersonalData(options) {
        return this.notificationResource.post({ data: options });
    }
}
