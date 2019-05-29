import ManageProjectTypeTemplate from './manage-project-type.component.html';
import _ from 'underscore';

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
        this.prjType = '';
        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
        this.slide = 'type';
    }

    continue(slide) {
        this.slide = slide;
    }

    finish() {
        if (this.prjType) {
            this.loading = true;
            var projectData = {};
            projectData.projectType = this.prjType;
            projectData.projectId = this.project.value.projectId;
            projectData.title = this.project.value.title;
            projectData.uuid = this.project.uuid;
            projectData.description = this.project.value.description;
            projectData.keywords = this.project.value.keywords;
            projectData.pi = this.project.value.pi;
            projectData.coPis = this.project.value.coPis;
            projectData.teamMembers = this.project.value.teamMembers;
            projectData.associatedProjects = this.project.value.associatedProjects;
            projectData.awardNumber = this.project.value.awardNumber;

            this.savePrj(projectData).then((project) => {
                this.DataBrowserService.state().project.value.projectType = project.value.projectType;
                this.close({$value: project});
                this.loading = false;
                this.$state.go('projects.curation', { projectId: project.uuid }, { reload: true }).then(() => {
                    this.ProjectService.editProject(project);
                });
            });
        }
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
