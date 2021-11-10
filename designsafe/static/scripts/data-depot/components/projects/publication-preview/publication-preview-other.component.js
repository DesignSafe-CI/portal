import PublicationPreviewOtherTemplate from './publication-preview-other.component.html';
import PublicationPopupTemplate from './publication-popup.html';

class PublicationPreviewOtherCtrl {

    constructor(ProjectEntitiesService, ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.browser = {}
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.project = this.ProjectService.resolveParams.project;
        this.listings = this.ProjectService.resolveParams.selectedListings;
        this.data = this.ProjectService.resolveParams.data;
        this.ui = {
            loading: true,
        };

        if (!this.data) {
                // we do not display a file listing in other's preview section
                this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.browser.project = project;
                this.ui.loading = false;
            });
        } else {
            this.browser = this.data;
            this.ui.loading = false;
        }
    }
    
    goWork() {
        this.$state.go('projects.view', {projectId: this.browser.project.uuid, data: this.browser}, {reload: true});
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.browser.project.uuid, data: this.browser}, {reload: true});
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
                    state.go('projects.pipelineStart', {projectId: browser.project.uuid}, {reload: true});
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

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

    filteredHazmapperMaps(maps) {
      maps = maps ? maps : [];

      maps.forEach(map => {
        switch(map.deployment) {
          case 'production':
            map.href = `https://hazmapper.tacc.utexas.edu/hazmapper/project/${map.uuid}`;
            break;
          case 'staging':
            map.href = `https://hazmapper.tacc.utexas.edu/staging/project/${map.uuid}`;
            break;
          default:
            map.href = `http://localhost:4200/project/${map.uuid}`;
        }
      });

      if (window.location.origin.includes('designsafe-ci.org')) {
        return maps.filter(map => map.deployment === 'production');
      }

      return maps;
    }
}


export const PublicationPreviewOtherComponent = {
    template: PublicationPreviewOtherTemplate,
    controller: PublicationPreviewOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
