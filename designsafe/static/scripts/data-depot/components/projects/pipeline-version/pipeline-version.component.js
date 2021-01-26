import PipelineVersionTemplate from './pipeline-version.template.html';
import PipelineVersionChangesTemplate from './pipeline-version-changes.template.html';

class PipelineVersionCtrl {
    constructor(
        ProjectService,
        $state
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$state = $state;
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

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    goVersion() {
        this.$state.go('projects.pipelineVersion', { projectId: this.projectId }, { reload: true });
    }

    goVersionChanges() {
        this.$state.go('projects.pipelineVersionChanges', { projectId: this.projectId }, { reload: true });
    }
}

export const PipelineVersionComponent = {
    template: PipelineVersionTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const PipelineVersionChangesComponent = {
    template: PipelineVersionChangesTemplate,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
