import PipelineOtherTemplate from './pipeline-other.component.html';
import _ from 'underscore';

class PipelineOtherCtrl {

    constructor(ProjectService, FileListingService, $uibModal, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.browser =  {}
        this.FileListingService = FileListingService;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.simulation = this.ProjectService.resolveParams.experiment;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;

        this.browser.project = this.project;
        this.browser.listing = this.selectedListings;
        this.fl = {
            showSelect: false,
            showHeader: true,
            showTags: true,
            editTags: false,
        };

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.$state.go('projects.pipelineStart', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view', {projectId: this.project.uuid}, {reload: true});
    }

    goProject() {
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goTeam() {
        this.$state.go('projects.pipelineTeam', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

}

export const PipelineOtherComponent = {
    template: PipelineOtherTemplate,
    controller: PipelineOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
