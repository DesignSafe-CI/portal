import PipelineAuthorsTemplate from './pipeline-authors.component.html';
import _ from 'underscore';

class PipelineAuthorsCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
        this.selectedAuthor = '';
        this.saved = false;
        this.validAuths = true;
        this.loading = true;

        /*
        Currently having issues with storing data in sessionStorage.
        The object methods are lost when parsing the data, but we can
        use the data to restore the project info.
        */
        this.setEntitiesRel = (resp) => {
            this.prjModel.appendEntitiesRel(resp);
            return resp;
        };

        this.selectedExp = () => {
            this.prjModel.experiment_set.forEach((exp) => {
                if (exp.uuid == this.experiment.uuid) {
                    this.expModel = exp;
                }
            });
        };

        this.verifyAuthors = (expAuthors) => {
            if (typeof expAuthors != 'undefined' && typeof expAuthors[0] != 'string') {
                this.validAuths = true;
            } else {
                this.validAuths = false;
            }
        };

        this.ProjectService.get({ uuid: this.project.uuid }).then((project) => {
            this.prjModel = project;
            this.ProjectEntitiesService.listEntities({ uuid: this.project.uuid, name: 'all' })
            .then(this.setEntitiesRel)
            .then(() => {
                this.selectedExp();
                this.verifyAuthors(this.expModel.value.authors);
                this.loading = false;
            });
        });       
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {projectId: this.project.uuid}, {reload: true});
    }

    goLicenses() {
        this.$state.go('projects.pipelineLicenses', {projectId: this.project.uuid}, {reload: true});
    }

    orderAuthors(up) {
        var a;
        var b;
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.expModel.value.authors.find(x => x.order === this.selectedAuthor.order - 1);
            b = this.expModel.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= this.expModel.value.authors.length - 1) {
                return;
            }
            // move down
            a = this.expModel.value.authors.find(x => x.order === this.selectedAuthor.order + 1);
            b = this.expModel.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveAuthors() {
        var exp = this.expModel;
        exp.value.authors = this.expModel.value.authors;
        exp.value.guests = this.expModel.value.guests;
        this.ProjectEntitiesService.update({
            data: {
                uuid: exp.uuid,
                entity: exp
            }
        }).then((e) => {
            var ent = this.prjModel.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.saved = true;
        });
    }

}

PipelineAuthorsCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

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
