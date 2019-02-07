import CurationDirectoryTemplate from './curation-directory.component.html';
import _ from 'underscore';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.browser = this.DataBrowserService.state();
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.loading = true;

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

    matchingGroup(exp, model) {
        // match appropriate data to corresponding experiment
        var result = false;
        model.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid});
    }

    goPreview() {
        this.$state.go('projects.preview', {projectId: this.browser.project.uuid});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
    }

    manageExperiments() {
        // need to data when this is closed (not working atm)
        var experimentsAttr = this.browser.project.getRelatedAttrName('designsafe.project.experiment');
        var experiments = this.browser.project[experimentsAttr];
        if (typeof experiments === 'undefined') {
            this.browser.project[experimentsAttr] = [];
            experiments = this.browser.project[experimentsAttr];
        }
        this.ProjectService.manageExperiments({'experiments': experiments, 'project': this.browser.project});
    }

    manageSimulations() {
        // need to data when this is closed (not working atm)
        var simulationAttr = this.browser.project.getRelatedAttrName('designsafe.project.simulation');
        var simulations = this.browser.project[simulationAttr];
        if (typeof simulations === 'undefined'){
          this.browser.project[simulationAttr] = [];
          simulations = this.browser.project[simulationAttr];
        }
        this.ProjectService.manageSimulations({'simulations': simulations, 'project': this.browser.project});
    }

    manageHybridSimulations() {
        // need to data when this is closed (not working atm)
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
        // need to data when this is closed (not working atm)
        this.ProjectService.manageCategories({'project': this.browser.project});
    }
}

CurationDirectoryCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$state', '$q'];

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
