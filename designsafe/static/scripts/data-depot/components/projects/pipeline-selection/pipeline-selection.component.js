import PipelineSelectionTemplate from './pipeline-selection.component.html';
import _ from 'underscore';

class PipelineSelectionCtrl {

    constructor(ProjectEntitiesService, ProjectService, $uibModal, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.browser = this.ProjectService.data;

        this.setEntitiesRel = (resp) => {
            this.browser.project.appendEntitiesRel(resp);
            return resp;
        };

        window.sessionStorage.clear();
        // get project data if necessary (if a user refreshes or visits path directly)
        if (!this.browser.project) {
            this.ProjectService.get({uuid: this.projectId}).then((project) => {
                this.browser.project = project;
                this.ProjectEntitiesService.listEntities({uuid: this.projectId, name: 'all'}).then(this.setEntitiesRel);
            }).then(() => {
                window.sessionStorage.setItem('projectData', JSON.stringify(this.browser.project));
            });
        } else {
            window.sessionStorage.setItem('projectData', JSON.stringify(this.browser.project));
        }
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

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goPreview() {
        this.$state.go('projects.preview', {projectId: this.browser.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {projectId: this.browser.project.uuid}, {reload: true});
    }

    selectExperiment(exp) {
        window.sessionStorage.setItem('experimentData', JSON.stringify(exp));
    }

    retrieveExperiment() {
        this.experiment = JSON.parse(window.sessionStorage.getItem('experimentData'));
    }
}

PipelineSelectionCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', '$uibModal', '$state'];

export const PipelineSelectionComponent = {
    template: PipelineSelectionTemplate,
    controller: PipelineSelectionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
