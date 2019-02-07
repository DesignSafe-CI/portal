import PipelineCategoriesTemplate from './pipeline-categories.component.html';
import _ from 'underscore';

class PipelineCategoriesCtrl {

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
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
        this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
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

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }
    
    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {projectId: this.project.uuid}, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {projectId: this.project.uuid}, {reload: true});
    }

    editCategory() {
        this.ProjectService.manageCategories({'project': this.prjModel});
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
}

PipelineCategoriesCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$state', '$q'];

export const PipelineCategoriesComponent = {
    template: PipelineCategoriesTemplate,
    controller: PipelineCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
