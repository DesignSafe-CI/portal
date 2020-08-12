import PublicationPreviewTemplate from './publication-preview.component.html';
import PublicationPopupTemplate from './publication-popup.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PublicationPreviewCtrl {

    constructor( $stateParams, ProjectEntitiesService, ProjectService, DataBrowserService, FileListingService, FileOperationService, FileListing, $uibModal, $state, $q) {
        'ngInject';
        this.$stateParams = $stateParams;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
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
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
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

        this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                    query_string: this.$stateParams.query_string
                }).toPromise(),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
            ])
            .then(([project, listing, ents]) => {
                this.breadcrumbParams = {
                    root: {label: project.value.projectId, path: ''}, 
                    path: this.FileListingService.listings.main.params.path,
                    skipRoot: false
                };

                this.breadcrumbParams.root.label = project.value.projectId
                this.browser.project = project;
                this.browser.project.appendEntitiesRel(ents);
                this.browser.listing = this.FileListingService.listings.main.listing;
                this.FileListingService.abstractListing(ents, project.uuid).subscribe((_) => {
                    this.ui.loading = false;
                });
            });

    }

    matchingGroup(exp, model) {
        if (!exp) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the experiment level
            // match appropriate data to corresponding experiment
            if(model.associationIds.indexOf(exp.uuid) > -1) {
                return true;
            }
            return false;
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
    
    goWork() {
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser});
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
                    state.go('projects.pipelineSelectExp', {projectId: browser.project.uuid}, {reload: true});
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

    showAuthor(author) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
            },
            size: 'author',
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
