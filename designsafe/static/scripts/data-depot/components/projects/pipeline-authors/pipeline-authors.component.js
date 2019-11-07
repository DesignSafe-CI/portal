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
        this.validAuths = true;
        this.savedStatus = {};


        if (!this.project) {
            this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.project = project;
                this.prepProject();
                this.$state.go(this.selectDest, {projectId: this.projectId}, {reload: true});
            });
        } else {
            this.projType = this.project.value.projectType;
            this.prepProject();
            this.verifyAuthors = (entAuthors) => {
                if (typeof entAuthors != 'undefined' && typeof entAuthors[0] != 'string') {
                    this.validAuths = true;
                } else {
                    this.validAuths = false;
                }
            };
            this.primaryEntities.forEach((ent) => {
                this.verifyAuthors(ent.value.authors);
                this.savedStatus[ent.uuid] = {'saved': false};
            });
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

    setSavedStatus(entity, status) {
        this.savedStatus[entity.uuid].saved = status;
    }

    orderAuthors(up, entity) {
        this.setSavedStatus(entity, false);
        var a;
        var b;
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = entity.value.authors.find(x => x.order === this.selectedAuthor.order - 1);
            b = entity.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= entity.value.authors.length - 1) {
                return;
            }
            // move down
            a = entity.value.authors.find(x => x.order === this.selectedAuthor.order + 1);
            b = entity.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveAuthors(entity) {
        var exp = entity;
        this.setSavedStatus(entity, false);
        this.loading = true;
        exp.value.authors = entity.value.authors;
        exp.value.guests = entity.value.guests;
        this.ProjectEntitiesService.update({
            data: {
                uuid: exp.uuid,
                entity: exp
            }
        }).then((e) => {
            var ent = this.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.setSavedStatus(entity, true);
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
