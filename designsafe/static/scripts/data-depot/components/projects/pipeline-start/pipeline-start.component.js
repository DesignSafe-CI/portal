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
            isProcessing: false,
            publicationComp: '',
            amendComp: '',
            versionComp: '',
            previewComp: ''
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
                    if (this.publication.status != 'published') {
                        this.ui.isProcessing = true;
                    }
                }
                /*
                    BYPASS FOR TESTING!!!
                        If you're going to work on something in the amends/versioning pipeline, there
                        needs to be a publication object for reference. This bypass simply ignores the
                        'status' of the publication.
                */
                this.ui.isProcessing = false;
                /*
                    BYPASS FOR TESTING!!!
                */
                this.ui.loading = false;
            }, (error) => {
                this.ui.loading = false;
            });
            switch(this.project.value.projectType) {
                case 'experimental': {
                    this.ui.publicationComp = 'projects.pipelineSelectExp'
                    this.ui.amendComp = 'projects.amendExperiment'
                    this.ui.versionComp = 'projects.versionExperimentSelection'
                    this.ui.previewComp = 'projects.preview'
                    this.ui.showAmendVersion = true;
                    break;
                }
                case 'simulation': {
                    this.ui.publicationComp = 'projects.pipelineSelectSim'
                    this.ui.previewComp = 'projects.previewSim'
                    break;
                }
                case 'hybrid_simulation': {
                    this.ui.publicationComp = 'projects.pipelineSelectHybSim'
                    this.ui.previewComp = 'projects.previewHybSim'
                    break;
                }
                case 'field_recon': {
                    this.ui.publicationComp = 'projects.pipelineSelectField'
                    this.ui.previewComp = 'projects.previewFieldRecon'
                    break;
                }
                case 'other': {
                    this.ui.publicationComp = 'projects.pipelineSelectOther'
                    this.ui.amendComp = 'projects.amendOther'
                    this.ui.versionComp = 'projects.versionOtherSelection'
                    this.ui.previewComp = 'projects.previewOther'
                    this.ui.showAmendVersion = true;
                }
            }
        });
    }

    goBack() {
        this.$state.go(this.ui.previewComp, { projectId: this.projectId }, { reload: true });
    }

    goAmend() {
        this.$state.go(this.ui.amendComp, {
            projectId: this.projectId,
            project: this.project,
            publication: this.publication
        }, { reload: true });
    }

    goPublish() {
        this.$state.go(this.ui.publicationComp, {
            projectId: this.projectId
        }, { reload: true });
    }

    goVersion() {
        this.$state.go(this.ui.versionComp, {
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
