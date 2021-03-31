import PipelineAmendTemplate from './pipeline-amend.template.html';

class PipelineAmendCtrl {
    constructor(
        ProjectService,
        $uibModal,
        $state,
        $http
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
    }

    $onInit() {
        this.ui = {
            loading: true
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.ProjectService.get({ uuid: this.projectId }).then((project) => {
            this.project = project;
            this.ui.loading = false;
        });
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

    submitAmend() {
        this.ui.loading = true;
        this.$http.post(
            // This needs to route to the amend endpoint...
        ).then((resp) => {
            this.ui.submitted = true;
        }).finally( () => {
            this.ui.loading = false;
        });
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