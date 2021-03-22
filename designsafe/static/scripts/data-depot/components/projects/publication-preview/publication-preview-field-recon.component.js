import PublicationPreviewFieldReconTemplate from './publication-preview-field-recon.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewFieldReconCtrl {

    constructor($scope, $stateParams, ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';
        this.$scope = $scope;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$stateParams = $stateParams
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
            }),
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
        ])
        .then(([project, listing, ents]) => {
            this.breadcrumbParams = {
                root: {label: project.value.projectId, path: ''}, 
                path: this.FileListingService.listings.main.params.path,
                skipRoot: false
            };
            this.browser.project = project;
            this.browser.project.appendEntitiesRel(ents);
            
            this.primaryEnts = [].concat(
                this.browser.project.mission_set || [],
                this.browser.project.report_set || []
            );
            this.secondaryEnts = [].concat(
                this.browser.project.socialscience_set || [],
                this.browser.project.planning_set || [],
                this.browser.project.geoscience_set || []
            );
            this.orderedPrimary = this.ordered(this.browser.project, this.primaryEnts);
            this.orderedSecondary = {};
            this.orderedPrimary.forEach((primEnt) => {
                if (primEnt.name === 'designsafe.project.field_recon.mission') {
                    this.orderedSecondary[primEnt.uuid] = this.ordered(primEnt, this.secondaryEnts);
                }
            });

            
            this.browser.listing = this.FileListingService.listings.main.listing;
            this.FileListingService.abstractListing(ents, project.uuid).then((_) => {
                this.ui.loading = false;
                //this.$scope.$apply();
            });
        });
    }

    emptyCheck(element) {
        for (var i = 0; i < element.length; i++) {
            if (typeof element[i] === 'object' && Object.keys(element[i]).length > 0) {
                return true;
            }
        }
        return false;
    }

    matchingGroup(sim, model) {
        if (!sim) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.missions.length) {
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
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid});
    }

    manageProject() {
        return this.$uibModal.open({
            component: 'manageProject',
            resolve: {
                project: () => this.browser.project,
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    ordered(parent, entities) {
        let order = (ent) => {
            if (ent._ui && ent._ui.orders && ent._ui.orders.length) {
                return ent._ui.orders.find(order => order.parent === parent.uuid);
            }
            return 0;
        };
        entities.sort((a,b) => {
            if (typeof order(a) === 'undefined' || typeof order(b) === 'undefined') {
                return -1;
            }
            return (order(a).value > order(b).value) ? 1 : -1;
        });

        return entities;
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
                    state.go('projects.pipelineSelectField', {projectId: browser.project.uuid}, {reload: true});
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

    showAuthor(author) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
            },
            size: 'author'
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

    isProjectReport(report) {
        return !report.value.missions.length;
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

export const PublicationPreviewFieldReconComponent = {
    template: PublicationPreviewFieldReconTemplate,
    controller: PublicationPreviewFieldReconCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
