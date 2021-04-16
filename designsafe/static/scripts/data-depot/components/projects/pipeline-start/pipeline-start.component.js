import PipelineStartTemplate from './pipeline-start.template.html';

class PipelineStartCtrl {
    constructor(
        PublicationService,
        ProjectService,
        $state
    ) {
        'ngInject';
        this.PublicationService = PublicationService;
        this.ProjectService = ProjectService;
        this.$state = $state;
    }

    $onInit() {
        this.ui = {
            loading: true,
            showAmendVersion: false,
            isPublished: false,
            directSelect: '',
            directPreview: ''
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.ProjectService.get({ uuid: this.projectId }).then((project) => {
            this.project = project;
            this.PublicationService.getPublished(this.project.value.projectId)
            .then((resp) => {
                this.publication = (resp.data.latestRevision
                    ? resp.data.latestRevision
                    : resp.data
                );
                if (this.publication.status) {
                    this.ui.isPublished = true;
                }
                this.ui.loading = false;
            }, (error) => {
                this.ui.loading = false;
            });
            switch(this.project.value.projectType) {
                case 'experimental': {
                    this.ui.directSelect = 'projects.pipelineSelectExp'
                    this.ui.directPreview = 'projects.preview'
                    break;
                }
                case 'simulation': {
                    this.ui.directSelect = 'projects.pipelineSelectSim'
                    this.ui.directPreview = 'projects.previewSim'
                    break;
                }
                case 'hybrid_simulation': {
                    this.ui.directSelect = 'projects.pipelineSelectHybSim'
                    this.ui.directPreview = 'projects.previewHybSim'
                    break;
                }
                case 'field_recon': {
                    this.ui.directSelect = 'projects.pipelineSelectField'
                    this.ui.directPreview = 'projects.previewFieldRecon'
                    break;
                }
                case 'other': {
                    this.ui.directSelect = 'projects.pipelineSelectOther'
                    this.ui.directPreview = 'projects.previewOther'
                    this.ui.showAmendVersion = true;
                }
            }
        });
    }

    goBack() {
        this.$state.go(this.ui.directPreview, { projectId: this.projectId }, { reload: true });
    }

    goAmend() {
        this.$state.go('projects.pipelineAmend', {
            projectId: this.projectId,
            project: this.project,
            publication: this.publication
        }, { reload: true });
    }

    goPublish() {
        // drop into pipeline based on project type
        this.$state.go(this.ui.directSelect, { projectId: this.projectId }, { reload: true });
    }

    goVersion() {
        // version selection for other will allow users to select the files they want to publish
        this.$state.go('projects.pipelineVersion', {
            projectId: this.projectId,
            publication: this.publication
        }, { reload: true });
    }
}

export const PipelineStartComponent = {
    template: PipelineStartTemplate,
    controller: PipelineStartCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
