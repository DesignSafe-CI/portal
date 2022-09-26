import AmendOtherTemplate from './amend-other.template.html';

class PipelineAmendOtherCtrl {
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
            loading: true,
            success: false,
            error: false,
            submitted: false,
            confirmed: false,
            showEdit: false,
            showOverview: false,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        if (!this.publication || !this.project) {
            this.goStart();
        } else {
            this.authors = this.publication.project.value.teamOrder;
            this.ui.loading = false;
        }
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

    saveAuthors() {
        this.ui.confirmed = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    submitAmend() {
        this.ui.loading = true;
        this.$http.put(
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

}

export const AmendOtherComponent = {
    template: AmendOtherTemplate,
    controller: PipelineAmendOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
