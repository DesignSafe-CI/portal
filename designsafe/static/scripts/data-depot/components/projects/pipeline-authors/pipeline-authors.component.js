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
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.experiment = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        this.selectedAuthor = '';
        this.saved = false;
        this.validAuths = true;


        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelect', {projectId: this.projectId}, {reload: true});
        }

        // this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
        this.verifyAuthors = (expAuthors) => {
            if (typeof expAuthors != 'undefined' && typeof expAuthors[0] != 'string') {
                this.validAuths = true;
            } else {
                this.validAuths = false;
            }
        };
        this.verifyAuthors(this.experiment.value.authors);    
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goLicenses() {
        this.$state.go('projects.pipelineLicenses', {
            projectId: this.projectId,
            project: this.project,
            experiment: this.experiment,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    orderAuthors(up) {
        var a;
        var b;
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.experiment.value.authors.find(x => x.order === this.selectedAuthor.order - 1);
            b = this.experiment.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= this.experiment.value.authors.length - 1) {
                return;
            }
            // move down
            a = this.experiment.value.authors.find(x => x.order === this.selectedAuthor.order + 1);
            b = this.experiment.value.authors.find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveAuthors() {
        var exp = this.experiment;
        exp.value.authors = this.experiment.value.authors;
        exp.value.guests = this.experiment.value.guests;
        this.ProjectEntitiesService.update({
            data: {
                uuid: exp.uuid,
                entity: exp
            }
        }).then((e) => {
            var ent = this.project.getRelatedByUuid(e.uuid);
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
