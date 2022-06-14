import ManageProjectTypeTemplate from './manage-project-type.template.html';

class ManageProjectTypeCtrl {

    constructor($http, $uibModal, ProjectService, $state) {
        'ngInject';
        this.$http = $http
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
        this.$state = $state;
    }

    $onInit() {
        this.project = this.resolve.options.project;
        this.warning = this.resolve.options.warning;
        this.preview = this.resolve.options.preview;
        this.prjType = '';
        this.slide = 'type';
        this.protectedData = -1;
        if (this.preview) {
            this.prjType = this.project.value.projectType;
            this.slide = 'overview';
        }
    }

    continue(slide) {
        this.slide = slide;
    }

    finish() {
        if (this.preview) {
            this.close();
        } else if (this.prjType) {
            this.loading = true;
            var projectData = {
                projectType: this.prjType,
                uuid: this.project.uuid,
            };
            if (this.prjType === 'field_recon' && this.protectedData > 0) {
                this.sendNotificationEmail();
            }
            this.ProjectService.save(projectData).then((resp) => {
                this.project = resp;
                this.loading = false;
                this.close();
                this.$state.go('projects.curation', { projectId: this.project.uuid }, { reload: true }).then(() => {
                    this.$uibModal.open({
                        component: 'manageProject',
                        resolve: {
                            project: () => this.project,
                        },
                        backdrop: 'static',
                        size: 'lg',
                    });
                });
            });
        }
    }

    sendNotificationEmail() {
        this.ProjectService.notifyPersonalData({
            uuid: this.project.uuid,
            username: this.project.value.pi
        })
    }
}

export const ManageProjectTypeComponent = {
    template: ManageProjectTypeTemplate,
    controller: ManageProjectTypeCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};