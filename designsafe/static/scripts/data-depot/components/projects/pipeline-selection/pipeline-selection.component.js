import PipelineSelectionExpTemplate from './pipeline-selection-exp.template.html';
import PipelineSelectionSimTemplate from './pipeline-selection-sim.template.html';
import PipelineSelectionHybSimTemplate from './pipeline-selection-hyb-sim.template.html';
import PipelineSelectionFieldTemplate from './pipeline-selection-field.template.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PipelineSelectionCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$state = $state;
        this.$q = $q;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.selectedEnts = [];
        this.ui = {
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            loading: true,
        };

        this.$q.all([
            this.ProjectService.get({ uuid: this.projectId }),
            this.DataBrowserService.browse(
                { system: 'project-' + this.projectId, path: this.filePath },
                { query_string: this.$state.params.query_string }
            ),
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
        ]).then(([project, listing, entities]) => {
            this.browser.project = project;
            this.prepProject();
            this.browser.project.appendEntitiesRel(entities);
            this.browser.listing = listing;
            this.browser.listing.href = this.$state.href('projects.view.data', {
                projectId: this.projectId,
                filePath: this.browser.listing.path,
                projectTitle: this.browser.project.value.projectTitle,
            });
            this.browser.listing.children.forEach((child) => {
                child.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: child.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                child.setEntities(this.projectId, entities);
            });
            var allFilePaths = [];
            this.browser.listings = {};
            var apiParams = {
                fileMgr: 'agave',
                baseUrl: '/api/agave/files',
                searchState: 'projects.view.data',
            };
            entities.forEach((entity) => {
                this.browser.listings[entity.uuid] = {
                    name: this.browser.listing.name,
                    path: this.browser.listing.path,
                    system: this.browser.listing.system,
                    trail: this.browser.listing.trail,
                    children: [],
                };
                allFilePaths = allFilePaths.concat(entity._filePaths);
            });

            this.setFilesDetails = (paths) => {
                let filePaths = [...new Set(paths)];
                var p = this.$q((resolve, reject) => {
                    var results = [];
                    var index = 0;
                    var size = 5;
                    var fileCalls = filePaths.map(filePath => {
                        return this.FileListing.get(
                            { system: 'project-' + this.browser.project.uuid, path: filePath }, apiParams
                        ).then((resp) => {
                            if (!resp) {
                                return;
                            }
                            var allEntities = this.browser.project.getAllRelatedObjects();
                            var entities = allEntities.filter((entity) => {
                                return entity._filePaths.includes(resp.path);
                            });
                            entities.forEach((entity) => {
                                resp._entities.push(entity);
                                this.browser.listings[entity.uuid].children.push(resp);
                            });
                            return resp;
                        });
                    });

                    var step = () => {
                        var calls = fileCalls.slice(index, (index += size));
                        if (calls.length) {
                            this.$q.all(calls)
                                .then((res) => {
                                    results.concat(res);
                                    step();
                                    return res;
                                })
                                .catch(reject);
                        } else {
                            resolve(results);
                        }
                    };
                    step();
                });
                return p.then(
                    (results) => {
                        this.ui.loading = false;
                        return results;
                    },
                    (err) => {
                        this.ui.loading = false;
                        this.browser.ui.error = err;
                    });
            };
            this.setFilesDetails(allFilePaths);
        });
    }

    prepProject() {
        this.matchingGroupKey = null;
        this.projectSet = null;
        this.previewDest = null;
        this.subEntities = null;
        if (this.browser.project.value.projectType === 'experimental'){
            this.matchingGroupKey = 'experiments';
            this.projectSet = 'experiment_set';
            this.previewDest = 'projects.preview';
            this.subEntities = [
                'modelconfig_set',
                'sensorlist_set',
                'event_set',
                'report_set',
                'analysis_set'
            ];
        }
        if (this.browser.project.value.projectType === 'simulation'){
            this.matchingGroupKey = 'simulations';
            this.projectSet = 'simulation_set';
            this.previewDest = 'projects.previewSim';
            this.subEntities = [
                'model_set',
                'input_set',
                'output_set',
                'report_set',
                'analysis_set'
            ];
        }
        if (this.browser.project.value.projectType === 'hybrid_simulation'){
            this.matchingGroupKey = 'hybridSimulations';
            this.projectSet = 'hybridsimulation_set';
            this.previewDest = 'projects.previewHybSim';
            this.subEntities = [
                'globalmodel_set',
                'coordinator_set',
                'simsubstructure_set',
                'expsubstructure_set',
                'coordinatoroutput_set',
                'expoutput_set',
                'simoutput_set',
                'analysis_set',
                'report_set'
            ];
        }
        if (this.browser.project.value.projectType === 'field_recon'){
            this.matchingGroupKey = 'missions';
            this.projectSet = 'mission_set';
            this.previewDest = 'projects.previewFieldRecon';
            this.subEntities = ['collection_set'];
        }
    }

    getEF(str) {
        let efs = this.ui.efs[this.browser.project.value.projectType];
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    hasEndDate(date) {
        if (Date.parse(date)) {
            return true;
        }
        return false;
    }

    matchingGroup(primaryEnt, subEnt) {
        if (!primaryEnt) {
            // if the sub entity is related to the project and not a primary entity
            if (!subEnt.value[this.matchingGroupKey]) {
                return;
            } else if (subEnt.associationIds.indexOf(this.projectId) > -1 && !subEnt.value[this.matchingGroupKey].length) {
                return true;
            }
            return false;
        }
        // if the sub entity is related to the primary entity
        // match appropriate data to corresponding primary entity
        if (subEnt.associationIds.indexOf(primaryEnt.uuid) > -1) {
            return true;
        }
        return false;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', { projectId: this.projectId }, { reload: true });
    }

    goPreview() {
        this.$state.go(this.previewDest, { projectId: this.projectId }, { reload: true });
    }

    goProject() {
        this.gatherSelections(); // need to adjust this for a list of entities...
        this.missing = this.ProjectService.checkSelectedFiles(this.browser.project, this.selectedEnts, this.selectedListings);

        if (this.missing.length) {
            return;
        }
        window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.browser.project,
            primaryEntities: this.selectedEnts,
            selectedListings: this.selectedListings,
        }, { reload: true });
    }

    selectEntity(ent) {
        let uuidsToSelect = [];
        if (this.selectedEnts.find(selEnt => selEnt.uuid === ent.uuid)) {
            this.selectedEnts = this.selectedEnts.filter(selEnt => selEnt.uuid !== ent.uuid);
        } else {
            this.selectedEnts.push(ent);
        }
        this.selectedEnts.forEach((sEnt) => {
            uuidsToSelect.push(sEnt.uuid);
        });

        // iterate over subEntities and select files related to primary entity...
        this.subEntities.forEach((subEntSet) => {
            this.browser.project[subEntSet].forEach((subEnt) => {
                if (subEnt.associationIds.some(uuid => uuidsToSelect.includes(uuid))){
                    this.DataBrowserService.select(this.browser.listings[subEnt.uuid].children);
                } else {
                    this.DataBrowserService.deselect(this.browser.listings[subEnt.uuid].children);
                }
            });
        });
    }

    gatherSelections() {
        this.selectedListings = {};
        Object.keys(this.browser.listings).forEach((key) => {
            this.selectedListings[key] = {
                name: this.browser.listing.name,
                path: this.browser.listing.path,
                system: this.browser.listing.system,
                trail: this.browser.listing.trail,
                children: [],
            };

            this.browser.listings[key].children.forEach((child) => {
                if (typeof child._ui.selected != 'undefined' && child._ui.selected === true) {
                    this.selectedListings[key].children.push(child);
                }
            });
            if (!this.selectedListings[key].children.length) {
                delete this.selectedListings[key];
            }
        });
    }
}

export const PipelineSelectionExpComponent = {
    template: PipelineSelectionExpTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};

export const PipelineSelectionSimComponent = {
    template: PipelineSelectionSimTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};

export const PipelineSelectionHybSimComponent = {
    template: PipelineSelectionHybSimTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};

export const PipelineSelectionFieldComponent = {
    template: PipelineSelectionFieldTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
