import AmendOther from './amend-other.template.html';
import AmendExperimental from './amend-experimental.template.html';

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
            confirmed: false
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        if (!this.publication || !this.project) {
            this.goStart();
        }
        this.authors = {};
        this.mainEntities = [];
        let prj_type = this.publication.project.value.projectType;
        if (prj_type == 'other') {
            this.authors = this.publication.project.value.teamOrder;
            this.ui.loading = false;
        } else {
            let attrnames = [];
            if (prj_type == 'experimental') {
                attrnames = ['experimentsList'];
            } else if (prj_type == 'simulation') {
                attrnames = ['simulations'];
            } else if (prj_type == 'hybrid_simulation') {
                attrnames = ['hybrid_simulations'];
            } else if (prj_type == 'field_recon') {
                attrnames = ['missions', 'reports'];
            }
            attrnames.forEach((name) => {
                this.publication[name].forEach((entity) => {
                    this.authors[entity.uuid] = entity.authors;
                    this.mainEntities.push(entity.uuid);
                });
            });
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

    goProject() {
        this.$state.go('projects.view', { projectId: this.project.uuid }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }
}

export const AmendOtherComponent = {
    template: AmendOther,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendExperimentalComponent = {
    template: AmendExperimental,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
