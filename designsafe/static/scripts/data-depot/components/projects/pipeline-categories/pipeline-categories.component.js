import PipelineCategoriesTemplate from './pipeline-categories.component.html';
import _ from 'underscore';

class PipelineCategoriesCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
        this.project = JSON.parse(window.sessionStorage.getItem('projectData'));
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

        this.ProjectService.get({uuid: this.project.uuid}).then((project) => {
            this.prjModel = project;
            this.ProjectEntitiesService.listEntities({uuid: this.project.uuid, name: 'all'})
            .then(this.setEntitiesRel)
            .then(() => {
                this.loading = false;
            });
        });
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }
    
    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {projectId: this.project.uuid}, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {projectId: this.project.uuid}, {reload: true});
    }

    editCategory() {
        this.ProjectService.manageCategories({'project': this.prjModel});
    }

    matchingGroup(exp, model) {
        // match appropriate data to corresponding experiment
        var result = false;
        model.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
}

PipelineCategoriesCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineCategoriesComponent = {
    template: PipelineCategoriesTemplate,
    controller: PipelineCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
