import AmendOtherTemplate from './amend-other.template.html';
import AmendExperimentTemplate from './amend-experimental.template.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

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
            confirmed: false,
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
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

    amendSubEntity(selection) {
        // we can't use the original manager for these entities.
        // we will have to come up with another way to make amends.

        // this.$uibModal.open({
        //     component: 'manageCategories',
        //     resolve: {
        //         project: () => this.project,
        //         edit: () => selection,
        //     },
        //     backdrop: 'static',
        //     size: 'lg',
        // });
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

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    getEF(str) {
        let efs = this.ui.efs[this.publication.project.value.projectType];
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    sortAuthors(authors) {
        if (authors.length && 'order' in authors[0]) return authors;
        const sortedAuthors = authors.sort((a, b) => a.order - b.order);
        return sortedAuthors;
    }

    matchingGroup(exp, model) {
        if (!exp) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the experiment level
            // match appropriate data to corresponding experiment
            if(model.associationIds.indexOf(exp.uuid) > -1) {
                return true;
            }
            return false;
        }
    }

    showCitation(entity) {
        this.$uibModal.open({
            component: 'publishedCitationModal',
            resolve: {
                publication: () => { return this.publication; },
                entity: () => { return entity; },
            },
            size: 'citation'
        });
    }

    showAuthor(author) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
            },
            size: 'author',
        });
    }
}

export const AmendOtherComponent = {
    template: AmendOtherTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendExperimentComponent = {
    template: AmendExperimentTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
