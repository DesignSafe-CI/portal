import PipelineAuthorsTemplate from './pipeline-authors.component.html';

class PipelineAuthorsCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.primaryEntities = this.ProjectService.resolveParams.primaryEntities;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.curDate = new Date().getFullYear();
        this.selectedAuthor = '';
        this.saved = false;
        this.validAuths = true;


        if (!this.project) {
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.project = project;
                this.prepProject();
                this.$state.go(this.selectDest, {projectId: this.projectId}, {reload: true});
            });
        } else {
            this.projType = this.project.value.projectType;
            this.prepProject();
            this.verifyAuthors = (expAuthors) => {
                if (typeof expAuthors != 'undefined' && typeof expAuthors[0] != 'string') {
                    this.validAuths = true;
                } else {
                    this.validAuths = false;
                }
            };
            this.verifyAuthors(this.primaryEntities.value.authors);
        }

    }

    prepProject() {
        this.selectDest = null;
        this.subEntityDest = null;
        this.placeholder = 'Entity';
        if (this.project.value.projectType === 'experimental'){
            this.selectDest = 'projects.pipelineSelectExp';
            this.subEntityDest = 'projects.pipelineSubEntityExp';
            this.placeholder = 'Experiment';
        }
        if (this.project.value.projectType === 'simulation'){
            this.selectDest = 'projects.pipelineSelectSim';
            this.subEntityDest = 'projects.pipelineSubEntitySim';
            this.placeholder = 'Simulation';
        }
        if (this.project.value.projectType === 'hybrid_simulation'){
            this.selectDest = 'projects.pipelineSelectHybSim';
            this.subEntityDest = 'projects.pipelineSubEntityHybSim';
            this.placeholder = 'Hybrid Simulation';
        }
        if (this.project.value.projectType === 'field_recon'){
            this.selectDest = 'projects.pipelineSelectField';
            this.subEntityDest = 'projects.pipelineSubEntityField';
            this.placeholder = 'Mission';
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goCategories() {
        this.$state.go(this.subEntityDest, {
            projectId: this.projectId,
            project: this.project,
            primaryEntities: this.primaryEntities,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goLicenses() {
        this.$state.go('projects.pipelineLicenses', {
            projectId: this.projectId,
            project: this.project,
            primaryEntities: this.primaryEntities,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    orderAuthors(up) {
        this.saved = false;
        var a;
        var b;
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.primaryEntities.value.authors.find(x => x.order === this.selectedAuthor.order - 1);
            b = this.primaryEntities.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= this.primaryEntities.value.authors.length - 1) {
                return;
            }
            // move down
            a = this.primaryEntities.value.authors.find(x => x.order === this.selectedAuthor.order + 1);
            b = this.primaryEntities.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveAuthors() {
        var exp = this.primaryEntities;
        this.saved = false;
        this.loading = true;
        exp.value.authors = this.primaryEntities.value.authors;
        exp.value.guests = this.primaryEntities.value.guests;
        this.ProjectEntitiesService.update({
            data: {
                uuid: exp.uuid,
                entity: exp
            }
        }).then((e) => {
            var ent = this.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.saved = true;
            this.loading = false;
        });
    }

}

export const PipelineAuthorsComponent = {
    template: PipelineAuthorsTemplate,
    controller: PipelineAuthorsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
