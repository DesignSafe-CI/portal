import PublicationPreviewHybSimTemplate from './publication-preview-hyb-sim.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewHybSimCtrl {

    constructor($stateParams, ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q, UserService) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$q = $q;
        this.FileOperationService = FileOperationService;
        this.UserService = UserService;
        this.loadingUserData = {
            pi: true,
            coPis: true,
        };
        this.authorData = {
            pi: {},
            coPis: null,
        };
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


        if (this.filePath === '/' && !this.$stateParams.query_string) {
            this.ui.fileNav = false;
        }

        this.$q
            .all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                    query_string: this.$stateParams.query_string
                }),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
            ])
            .then(([project, listing, ents]) => {
                this.breadcrumbParams = {
                    root: { label: project.value.projectId, path: '' },
                    path: this.FileListingService.listings.main.params.path,
                    skipRoot: false,
                };
                this.project = project;
                this.createdYear = new Date(this.project.created).getFullYear();
                // this.dateCreated = new Date(this.project.created);
                this.project.appendEntitiesRel(ents);

                this.hybSimEnts = [].concat(
                    this.project.hybridsimulation_set || []
                );
                this.dateCreated = this.dateCreated(this.hybSimEnts);

                this.listing = this.FileListingService.listings.main.listing;
                this.FileListingService.abstractListing(ents, project.uuid).then((_) => {
                    this.ui.loading = false;
                });
                const { pi } = this.project.value;
                this.UserService.get(pi).then((res) => {
                    this.authorData.pi = {
                        fname: res.first_name,
                        lname: res.last_name,
                        email: res.email,
                        name: res.username,
                        inst: res.profile.institution,
                    };
                    this.loadingUserData.pi = false;
                });
                if (this.project.value.coPis) {
                    this.authorData.coPis = new Array(this.project.value.coPis.length);
                    this.project.value.coPis.forEach((coPi, idx) => {
                        this.UserService.get(coPi).then((res) => {
                            this.authorData.coPis[idx] = {
                                fname: res.first_name,
                                lname: res.last_name,
                                email: res.email,
                                name: res.username,
                                inst: res.profile.institution,
                            };
                            if (idx === this.project.value.coPis.length - 1) this.loadingUserData.coPis = false;
                        });
                    });
                }
            });
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

    dateCreated(set) {
        let dateList = [];
        for (var i = 0; i < set.length; i++) {
            if (set[i].value.dois.toString() !== '' ){
                dateList.push({
                    key:   set[i].value.dois.toString(),
                    value: set[i].created
                });
            }
        }
        return dateList;
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    goWork() {
        this.$state.go('projects.view', {projectId: this.project.uuid});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.project.uuid});
    }

    prepareModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'state', 'project', function($uibModalInstance, state, project) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                    state.go('projects.pipelineStart', {projectId: project.uuid}, {reload: true});
                };
            }],
            resolve: {
                project: this.project,
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
                project: () => {return this.project; },
                readOnly: () => {return true;},
            },
            size: 'lg'
        });
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            //this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')}, {inherit: false})
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, ''), query_string: null})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
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
