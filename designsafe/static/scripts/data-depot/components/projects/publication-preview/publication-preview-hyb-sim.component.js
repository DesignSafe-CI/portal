import PublicationPreviewHybSimTemplate from './publication-preview-hyb-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';

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
        this.readOnly = this.$state.current.name.indexOf('publishedData') === 0;
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
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

        this.$q.all([
            this.ProjectService.get({ uuid: this.projectId }),
            this.DataBrowserService.browse(
                { system: 'project-' + this.projectId, path: this.filePath },
                { query_string: this.$state.params.query_string }
            ),
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
        ]).then(([project, listing, ents]) => {
            this.browser.project = project;
            this.browser.project.appendEntitiesRel(ents);
            this.browser.listing = listing;
            this.createAbstractListing(ents);
        });

        this.createAbstractListing = (entities) => {
            /*
            Create Abstract Listing:
            Since we need to list x number of files from anywhere within the project's directory,
            we need to try to list the minimum amount of paths within the project to get the file details.
            Once we have the listed files we can create the abstracted file listings (this.browser.listings).
            */
            this.browser.listings = {};
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

            let listingPaths = [];
            let allPaths = [];
            entities.forEach((entity) => {
                this.browser.listings[entity.uuid] = {
                    name: this.browser.listing.name,
                    path: this.browser.listing.path,
                    system: this.browser.listing.system,
                    trail: this.browser.listing.trail,
                    children: [],
                };
                allPaths = allPaths.concat(entity._filePaths);
            });
            allPaths.forEach((path) => {
                listingPaths = listingPaths.concat(path.match(`.*\/`)[0]);
            });
            let reducedPaths = { files: [...new Set(allPaths)], directories: [...new Set(listingPaths)] };

            this.populateListings = (paths, ents) => {
                let apiParams = this.DataBrowserService.apiParameters();
                var dirListings = paths.directories.map((dir) => {
                    return this.FileListing.get(
                        { system: 'project-' + this.browser.project.uuid, path: dir },
                        apiParams
                    ).then((resp) => {
                        if (!resp) {
                            return;
                        }
                        let files = resp.children;
                        ents.forEach((e) => {
                            files.forEach((f) => {
                                if (e._filePaths.indexOf(f.path) > -1) {
                                    f._entities.push(e);
                                    this.browser.listings[e.uuid].children.push(f);
                                }
                            });
                        });
                        return resp;
                    });
                });

                this.$q.all(dirListings).then(() => {
                    this.ui.loading = false;
                });
            };
            this.populateListings(reducedPaths, entities);
        };
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
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid});
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

    treeDiagram() {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
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
