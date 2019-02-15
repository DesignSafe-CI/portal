import PipelineSelectionOtherTemplate from './pipeline-selection-other.component.html';
import _ from 'underscore';
import { deprecate } from 'util';
import { FileCategorySelectorComponent } from '../../../../projects/components/file-category-selector/file-category-selector';

class PipelineSelectionOtherCtrl {

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
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.loading = true;
        this.fullTree = [this.filePath];
        
        if (!this.projectId) {
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
        }

        /*
        Other projects will get a normal listing, from that we'll build a
        selected listing containing files that the user has selected.
        */
        
        this.ProjectService.get({ uuid: this.projectId }
        ).then((project) => {
            this.browser.project = project;
            return this.DataBrowserService.browse(
                { system: 'project-' + this.projectId, path: this.filePath },
                { query_string: this.$state.params.query_string }
            );
        }).then((listing) => {
            this.browser.listing = listing;
            this.browser.listing.href = this.$state.href('projects.view.data', {
                projectId: this.projectId,
                filePath: this.browser.listing.path,
                projectTitle: this.browser.project.value.projectTitle,
            });
            this.selectedFiles = {
                name: this.browser.listing.name,
                path: this.browser.listing.path,
                system: this.browser.listing.system,
                trail: this.browser.listing.trail,
                children: [],
            };
            this.browser.showMainListing = true;
            this.loading = false;
        });

    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.projectId}, {reload: true});
    }

    goPreview() {
        this.$state.go('projects.previewOther', {projectId: this.projectId}, {reload: true});
    }

    goProject() {
        window.sessionStorage.setItem('projectId', JSON.stringify(this.browser.project.uuid));
        this.$state.go('projects.pipelineProject', {
            projectId: this.projectId,
            project: this.browser.project,
            selectedListings: this.selectedFiles,
        }, {reload: true});
    }

    selectAll() {
        this.DataBrowserService.select(this.browser.listing.children);

    }

    deselectAll() {
        this.DataBrowserService.deselect(this.browser.listing.children);
    }

    saveSelections() {
        this.browser.listing.children.forEach((child) => {
            if (typeof child._ui === 'undefined' || child._ui.selected === false) {
                if (this.selectedFiles.children.indexOf(child) > -1) {
                    this.selectedFiles.children.splice(this.selectedFiles.children.indexOf(child), 1);
                }
            } else if (child._ui.selected === true) {
                if (this.selectedFiles.children.indexOf(child) === -1) {
                    this.selectedFiles.children.push(child);
                }
            }
        });
    }

}

PipelineSelectionOtherCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$uibModal', '$state', '$q'];

export const PipelineSelectionOtherComponent = {
    template: PipelineSelectionOtherTemplate,
    controller: PipelineSelectionOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
