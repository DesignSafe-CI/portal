import PipelineStartTemplate from './pipeline-start.template.html';

class PipelineStartCtrl {
    constructor(
        PublicationService,
        ProjectService,
        ProjectEntitiesService,
        $state,
        $q
    ) {
        'ngInject';
        this.PublicationService = PublicationService;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$state = $state;
        this.$q = $q;
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
        this.$q.all([
            this.ProjectService.get({ uuid: this.projectId }),
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
        ]).then(([project, entities]) => {
            this.project = project;
            this.project.appendEntitiesRel(entities);
            this.PublicationService.getPublished(this.project.value.projectId).then((resp) => {
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
                this.ui.loading = false;
            }).catch((error) => {
                console.log('could not retrieve publication.');
                this.ui.loading = false;
            })
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
