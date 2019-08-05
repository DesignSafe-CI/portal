import PipelineCategoriesTemplate from './pipeline-categories.component.html';
import _ from 'underscore';

class PipelineCategoriesCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $uibModal, $state, $q) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.experiment = this.ProjectService.resolveParams.experiment;
        this.browser.project = this.ProjectService.resolveParams.project;
        this.browser.listings = this.ProjectService.resolveParams.selectedListings;
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };


        if (!this.browser.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelect', {projectId: this.projectId}, {reload: true});
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid}, {reload: true});
    }
    
    goExperiment() {
        this.$state.go('projects.pipelineExperiment', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.experiment,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }
    
    goAuthors() {
        this.$state.go('projects.pipelineAuthors', {
            projectId: this.projectId,
            project: this.browser.project,
            experiment: this.experiment,
            selectedListings: this.browser.listings,
        }, {reload: true});
    }

    editCategory(selection) {
        this.$uibModal.open({
            component: 'manageCategories',
            resolve: {
                browser: () => this.browser,
                edit: () => selection,
            },
            size: 'lg',
        });
    }

    matchingGroup(exp, model) {
        // if the category is related to the project level
        if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
            return true;
        } else {
            // if the category is related to the experiment level
            // match appropriate data to corresponding experiment
            if(model.associationIds.indexOf(exp.uuid) > -1) {
                return true;
            }
            return false;
        }
    }
}

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
