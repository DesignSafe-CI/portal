import PipelineExperimentTemplate from './pipeline-experiment.component.html';
import _ from 'underscore';

class PipelineExperimentCtrl {

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
            this.ProjectEntitiesService.listEntities({uuid: this.project.uuid, name: 'all'}).then(this.setEntitiesRel);
        });
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {projectId: this.project.uuid}, {reload: true});
    }

    goCategories() {
        this.$state.go('projects.pipelineCategories', {projectId: this.project.uuid}, {reload: true});
    }

    editExp() {
        this.ProjectService.manageExperiments({'experiments': this.prjModel.experiment_set, 'project': this.prjModel});
    }

}

PipelineExperimentCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineExperimentComponent = {
    template: PipelineExperimentTemplate,
    controller: PipelineExperimentCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
