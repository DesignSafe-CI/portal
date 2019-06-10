import PublicationPreviewHybSimTemplate from './publication-preview-hyb-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import _ from 'underscore';

class PublicationPreviewHybSimCtrl {

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
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.project = this.ProjectService.resolveParams.project;
        this.listings = this.ProjectService.resolveParams.selectedListings;
        this.loading = true;
        window.sessionStorage.clear();


        if (this.project || this.listings) {
            this.browser.project = this.project;
            this.browser.listings = this.listings;
            this.loading = false;
        } else {
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
                            this.loading = false;
                        });
                };
                this.setFilesDetails(allFilePaths);
            });
        }
        
    }

    isSingle(val) {
        // we will have older projects with a single award number as a string
        if (val.length) {
            if (typeof val[0] === 'string') {
                return true;
            }
        }
        return false;
    }

    matchingGroup(sim, model) {
        if (!sim) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.hybridSimulations.length) {
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
        if (this.browser.project.hybridsimulation_set.length === 1) {
            return true;
        }
        return false;
    }
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goCuration() {
        window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid, project: this.browser.project, selectedListings: this.browser.listings}, {reload: true});
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
                    state.go('projects.pipelineSelectHybSim', {projectId: browser.project.uuid}, {reload: true});
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

export const PublicationPreviewHybSimComponent = {
    template: PublicationPreviewHybSimTemplate,
    controller: PublicationPreviewHybSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
