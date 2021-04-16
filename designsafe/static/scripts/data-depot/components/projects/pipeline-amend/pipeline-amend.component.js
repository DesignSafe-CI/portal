import PipelineAmendTemplate from './pipeline-amend.template.html';

class PipelineAmendCtrl {
    constructor(
        ProjectService,
        UserService,
        $uibModal,
        $state,
        $http
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
    }

    $onInit() {
        this.ui = {
            loading: true,
            success: false,
            error: false,
            submitted: false,
            sortAuthors: false,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        if (!this.publication || !this.project) {
            this.goStart();
        }
        this.ui.loading = false;
    }

    amendProject() {
        return this.$uibModal.open({
            component: 'amendProject',
            resolve: {
                project: () => this.project,
            },
            backdrop: 'static',
            size: 'lg',
        });
    }

    amendAuthors() {
        this.authors = this.publication.project.value.teamOrder;
        this.ui.sortAuthors = true;
    }

    submitAmend() {
        this.ui.loading = true;
        this.$http.post(
            '/api/projects/amend-publication/',
            {
                projectId: this.project.value.projectId,
                authors: this.authors || undefined
            }
        ).then((resp) => {
            this.ui.success = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        }, (error) => {
            this.ui.error = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        });
    }

    returnToProject() {
        this.$state.go('projects.view', { projectId: this.project.uuid }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    goAmend() {
        this.$state.go('projects.pipelineAmend', { projectId: this.projectId }, { reload: true });
    }

    goPublish() {
        // should drop into regular pipeline...
        this.$state.go('projects.pipelineSelect', { projectId: this.projectId }, { reload: true });
    }

    goVersion() {
        // version selection for other will allow users to select the files they want to publish
        this.$state.go('projects.pipelineVersionSelection', { projectId: this.projectId }, { reload: true });
    }
}

export const PipelineAmendComponent = {
    template: PipelineAmendTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
