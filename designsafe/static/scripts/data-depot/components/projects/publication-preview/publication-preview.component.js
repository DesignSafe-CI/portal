import PublicationPreviewTemplate from './publication-preview.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import _ from 'underscore';

class PublicationPreviewCtrl {

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
        this.loading = true;
        window.sessionStorage.clear();
        // window.sessionStorage.setItem('projectData', JSON.stringify(this.browser.project));


        /*
        update uniqe file listing
        we might want to consider a adding this to the
        FilesListing service if we start using it in
        multiple places...
        */
        this.setEntitiesRel = (resp) => {
            this.browser.project.appendEntitiesRel(resp);
            if (typeof this.browser.listing === 'undefined') {
                _.each(this.browser.listing.children, (child) => {
                    child.href = this.$state.href('projects.view.data', {
                        projectId: this.projectId,
                        filePath: child.path,
                        projectTitle: this.browser.project.value.projectTitle,
                    });
                    child.setEntities(this.projectId, resp);
                });
            }
            return resp;
        };

        this.DataBrowserService.browse(
            { system: 'project-' + this.projectId, path: this.filePath },
            { query_string: this.$state.params.query_string }
        ).then(() => {
            this.browser.listing.href = this.$state.href('projects.view.data', {
                projectId: this.projectId,
                filePath: this.browser.listing.path,
                projectTitle: this.browser.project.value.projectTitle,
            });
            this.browser.showMainListing = true;
        });

        this.ProjectService.get({ uuid: this.projectId }).then((project) => {
            this.browser.project = project;
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
                .then(this.setEntitiesRel)
                .then(() => {
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
                                }).then(() => {
                                    this.loading = false;
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
                                return results;
                            },
                            (err) => {
                                this.browser.ui.error = err;
                            });
                    };
                    this.setFilesDetails(allFilePaths);
                });
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
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid}, {reload: true});
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
                    state.go('projects.pipelineSelect', {projectId: browser.project.uuid}, {reload: true});
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
}

PublicationPreviewCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$uibModal', '$state', '$q'];

export const PublicationPreviewComponent = {
    template: PublicationPreviewTemplate,
    controller: PublicationPreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
