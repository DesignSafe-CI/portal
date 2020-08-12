import ProjectListingTemplate from './project-listing.component.html';
import _ from 'underscore';

class ProjectListingCtrl {
    constructor($scope, $state, $stateParams, Django, ProjectService, UserService) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$state = $state;
        this.$stateParams = $stateParams;
    }

    $onInit() {
        this.rootHref = this.$state.href('projects.list', {query_string: null});
        this.ProjectService.listProjects({ section: this.section, offset: 0, limit: 100, query_string: this.$stateParams.query_string });
    }

    getListing() {
      return this.ProjectService.listings[this.section]
    }

    href(project) {
        return this.$state.href('projects.view', {projectId: project.uuid, filePath: ''} )
    }

    handleBrowse($event, project) {
        // If we aren't in a modal, just use the standard href returned by this.href()
        if (this.section === 'main') {
            return
        }
        $event.preventDefault();
        this.onBrowse({$event, project});
    }

    browseRoot($event) {
        $event.preventDefault();
        switch(this.section) {
            case 'main':
                this.$state.go('projects.list', {query_string: null})
            break;
            case 'modal':
                this.ProjectService.listProjects({ section: this.section, offset: 0, limit: 100 });
                break;
        }

    }

    scrollToBottom() {
        if (!this.ProjectService.listings[this.section].reachedEnd) {
            this.ProjectService.scrollProjects({ section: this.section, query_string: this.$stateParams.query_string });
        }
        
    }
}

export const ProjectListingComponent = {
    controller: ProjectListingCtrl,
    controllerAs: '$ctrl',
    template: ProjectListingTemplate,
    bindings: {
        section: '<',
        onBrowse: '&?'
    },
};
