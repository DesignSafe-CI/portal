import CurationDirectoryTemplate from './curation-directory.component.html';
import _ from 'underscore';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.browser = this.DataBrowserService.state();
        this.$state = $state;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.data = this.ProjectService.resolveParams.data;
        this.loading = true;

        if (!this.data || this.data.listing.path != this.filePath) {
            this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.DataBrowserService.browse(
                    { system: 'project-' + this.projectId, path: this.filePath },
                    { query_string: this.$state.params.query_string }
                ),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
            ]).then(([project, listing, entities]) => {
                this.browser.project = project;
                this.browser.project.appendEntitiesRel(entities);
                this.browser.listing = listing;
                this.browser.listing.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: this.browser.listing.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                _.each(this.browser.listing.children, (child) => {
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
                _.each(entities, (entity) => {
                    this.browser.listings[entity.uuid] = {
                        name: this.browser.listing.name,
                        path: this.browser.listing.path,
                        system: this.browser.listing.system,
                        trail: this.browser.listing.trail,
                        children: [],
                    };
                    allFilePaths = allFilePaths.concat(entity._filePaths);
                });
    
                this.setFilesDetails = (filePaths) => {
                    filePaths = _.uniq(filePaths);
                    var p = this.$q((resolve, reject) => {
                        var results = [];
                        var index = 0;
                        var size = 5;
                        var fileCalls = _.map(filePaths, (filePath) => {
                            return this.FileListing.get(
                                { system: 'project-' + this.browser.project.uuid, path: filePath }, apiParams
                            ).then((resp) => {
                                if (!resp) {
                                    return;
                                }
                                var allEntities = this.browser.project.getAllRelatedObjects();
                                var entities = _.filter(allEntities, (entity) => {
                                    return _.contains(entity._filePaths, resp.path);
                                });
                                _.each(entities, (entity) => {
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
                            this.loading = false;
                            return results;
                        },
                        (err) => {
                            this.browser.ui.error = err;
                        });
                };
                this.setFilesDetails(allFilePaths);
            });
        } else {
            this.browser = this.data;
            this.loading = false;
        }
    }

    isSingle(val) {
        // we will have older projects with a single award number as a string
        if (val && val.length) {
            if (typeof val[0] === 'string') {
                return true;
            }
        }
        return false;
    }

    matchingGroup(exp, entity) {
        /*
        Match appropriate entity to corresponding experiment, sim, hybsim, etc...
        TODO: might be best to have this set up in ProjectEntitiesService.
        Just want to grab entities related to primary entity
        */
        var result = false;
        entity.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid, data: this.browser});
    }

    goPreview() {
        if (this.browser.project.value.projectType === 'experimental') {
            this.$state.go('projects.preview', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'simulation') {
            this.$state.go('projects.previewSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
            this.$state.go('projects.previewHybSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'other') {
            this.$state.go('projects.previewOther', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'field_recon') {
            this.$state.go('projects.previewFieldRecon', {projectId: this.browser.project.uuid, data: this.browser});
        }
    }

    editProject() {
        this.ProjectService.editProject(this.browser.project);
    }

    manageExperiments() {
        var experimentsAttr = this.browser.project.getRelatedAttrName('designsafe.project.experiment');
        var experiments = this.browser.project[experimentsAttr];
        if (typeof experiments === 'undefined') {
            this.browser.project[experimentsAttr] = [];
            experiments = this.browser.project[experimentsAttr];
        }
        this.ProjectService.manageExperiments({'experiments': experiments, 'project': this.browser.project});
    }

    manageSimulations() {
        var simulationAttr = this.browser.project.getRelatedAttrName('designsafe.project.simulation');
        var simulations = this.browser.project[simulationAttr];
        if (typeof simulations === 'undefined'){
          this.browser.project[simulationAttr] = [];
          simulations = this.browser.project[simulationAttr];
        }
        this.ProjectService.manageSimulations({'simulations': simulations, 'project': this.browser.project});
    }

    manageHybridSimulations() {
        var hybridSimulationAttr = this.browser.project.getRelatedAttrName(
            'designsafe.project.hybrid_simulation'
        );
        var hybridSimulations = this.browser.project[hybridSimulationAttr];
        if (typeof hybridSimulations === 'undefined'){
          this.browser.project[hybridSimulationAttr] = [];
          hybridSimulations = this.browser.project[hybridSimulationAttr];
        }
        this.ProjectService.manageHybridSimulations({'hybridSimulations': hybridSimulations, 'project': this.browser.project});
    }

    manageCategories() {
        this.ProjectService.manageCategories({'project': this.browser.project, 'selectedListings': this.browser.listings});
    }

    relateData() {
      this.$uibModal.open({
        component: 'projectTree',
        resolve: {
            project: () => {return this.browser.project; },
        },
        size: 'lg',
      });
    }

    manageFieldReconMissions() {
        this.$uibModal.open({
            component: 'fieldReconMissionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageFieldReconCollections() {
        this.$uibModal.open({
            component: 'fieldReconCollectionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageFieldReconReports() {
        this.$uibModal.open({
            component: 'fieldReconReportsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }
}

export const CurationDirectoryComponent = {
    template: CurationDirectoryTemplate,
    controller: CurationDirectoryCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
