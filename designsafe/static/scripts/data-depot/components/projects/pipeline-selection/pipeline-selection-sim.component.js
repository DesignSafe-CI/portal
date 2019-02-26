import PipelineSelectionSimTemplate from './pipeline-selection-sim.component.html';
import _ from 'underscore';
import { deprecate } from 'util';

class PipelineSelectionSimCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        // this.selectedFiles = {};
        this.loading = true;
        
        if (!this.projectId) {
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
        }

        /*
        update uniqe file listing
        we might want to consider a adding this to the
        FilesListing service if we start using it in
        multiple places...
        */
        
        this.ProjectService.get({ uuid: this.projectId }
        ).then((project) => {
            this.browser.project = project;
            return this.DataBrowserService.browse(
                { system: 'project-' + this.projectId, path: this.filePath },
                { query_string: this.$state.params.query_string }
            );
        }).then((listing) => {
            this.browser.listing = listing;
            this.browser.listing.href = this.$state.href('projects.view.data', {
                projectId: this.projectId,
                filePath: this.browser.listing.path,
                projectTitle: this.browser.project.value.projectTitle,
            });
            this.browser.showMainListing = true;
            return this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' });
        }).then((ents) => {
            this.browser.project.appendEntitiesRel(ents);
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: child.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                child.setEntities(this.projectId, ents);
            });
        }).then(() => {
            var entities = this.browser.project.getAllRelatedObjects();
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

    }

    matchingGroup(sim, model) {
        if (!sim) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.simulations.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the simulation level
            // match appropriate data to corresponding simulation
            if(model.associationIds.indexOf(sim.uuid) > -1) {
                return true;
            }
            return false;
        }
    }

    singleExperiment() {
        if (this.browser.project.simulation_set.length === 1) {
            return true;
        }
        return false;
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.projectId}, {reload: true});
    }

    goPreview() {
        this.$state.go('projects.previewSim', {projectId: this.projectId}, {reload: true});
    }

    goProject() {
        this.gatherSelections();
        this.missing = this.ProjectService.checkSelectedFiles(this.browser.project, this.selectedExp, this.selectedListings);

        if (this.missing.length) {
            return;
        } else {
            window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
            this.$state.go('projects.pipelineProject', {
                projectId: this.projectId,
                project: this.browser.project,
                experiment: this.selectedExp,
                selectedListings: this.selectedListings,
            }, {reload: true});
        }
    }

    selectExperiment(exp) {
        this.selectedExp = exp;
        var sets = ['model_set', 'input_set', 'output_set', 'report_set', 'analysis_set'];
        sets.forEach((set) => {
            this.browser.project[set].forEach((s) => {
                if (s.associationIds.indexOf(exp.uuid) > -1) {
                    this.DataBrowserService.select(this.browser.listings[s.uuid].children);
                } else {
                    this.DataBrowserService.deselect(this.browser.listings[s.uuid].children);
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

export const PipelineSelectionSimComponent = {
    template: PipelineSelectionSimTemplate,
    controller: PipelineSelectionSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
