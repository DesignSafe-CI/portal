import ManageProjectTypeTemplate from './manage-project-type.template.html';

class ManageProjectTypeCtrl {

    constructor(ProjectEntitiesService, ProjectModel, httpi, DataBrowserService, ProjectService, $state) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectModel = ProjectModel;
        this.httpi = httpi;
        this.DataBrowserService = DataBrowserService;
        this.ProjectService = ProjectService;
        this.$state = $state;
    }

    $onInit() {
        this.project = this.resolve.options.project;
        this.warning = this.resolve.options.warning;
        this.preview = this.resolve.options.preview;
        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
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
            var projectData = {};
            projectData.projectType = this.prjType;
            projectData.title = this.project.value.title;
            projectData.pi = this.project.value.pi;
            projectData.coPis = this.project.value.coPis;
            projectData.teamMembers = this.project.value.teamMembers;
            projectData.projectId = this.project.value.projectId;
            projectData.uuid = this.project.uuid;

            if (this.prjType === 'field_recon' && this.protectedData > 0) {
                this.sendNotificationEmail();
            }

            this.savePrj(projectData).then((project) => {
                this.close({$value: project});
                this.loading = false;
                this.$state.go('projects.curation', { projectId: project.uuid }, { reload: true }).then(() => {
                    this.ProjectService.editProject(project);
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

    savePrj(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    cancel() {
        this.close();
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