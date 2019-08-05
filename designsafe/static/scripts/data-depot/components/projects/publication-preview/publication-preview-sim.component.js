import PublicationPreviewSimTemplate from './publication-preview-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewSimCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.browser = this.DataBrowserService.state();
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.readOnly = this.$state.current.name.indexOf('publishedData') === 0;
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.data = this.ProjectService.resolveParams.data;
        this.ui = {
            fileNav: true,
            loading: true
        };
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };

        if (this.filePath === '/') {
            this.ui.fileNav = false;
        }

        this.createListings = () => {
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }).then((entities) => {
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
        };

        if (this.data && this.data.listing.path == this.filePath) {
            this.browser = this.data;
            if (typeof this.browser.listings === 'undefined') {
                this.createListings();
            } else {
                this.ui.loading = false;
            }
        } else {
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
                this.browser.listing.children.forEach((child) => {
                    child.href = this.$state.href('projects.view.data', {
                        projectId: this.projectId,
                        filePath: child.path,
                        projectTitle: this.browser.project.value.projectTitle,
                    });
                    child.setEntities(this.projectId, entities);
                });
                if (typeof this.browser.listings == 'undefined') {
                    this.createListings();
                } else {
                    this.ui.loading = false;
                }
            });
        }
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
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid, data: this.browser});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid, data: this.browser});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
    }

    prepareModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'state', 'browser', function($uibModalInstance, state, browser) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                    state.go('projects.pipelineSelectSim', {projectId: browser.project.uuid}, {reload: true});
                };
            }],
            resolve: {
                browser: this.browser,
                state: this.$state,
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
    }

    treeDiagram(rootCategory) {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
                rootCategoryUuid: () => {return rootCategory.uuid; },
                readOnly: () => {return true;},
            },
            size: 'lg'
        });
    }
}

PublicationPreviewSimCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$uibModal', '$state', '$q'];

export const PublicationPreviewSimComponent = {
    template: PublicationPreviewSimTemplate,
    controller: PublicationPreviewSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
