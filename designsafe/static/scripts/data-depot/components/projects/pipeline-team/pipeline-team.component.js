import PipelineTeamTemplate from './pipeline-team.template.html';
import _ from 'underscore';

class PipelineTeamCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, httpi, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.browser = this.DataBrowserService.state();
        this.httpi = httpi;
        this.$state = $state;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.selectedListings = this.ProjectService.resolveParams.selectedListings;
        this.saved = false;
        this.curDate = new Date().getFullYear();

        if (!this.project) {
            /*
            Try to pass selected listings into a simple object so that we can
            rebuild the project and selected files if a refresh occurs...
            for now we can send them back to the selection area
            */
            this.projectId = JSON.parse(window.sessionStorage.getItem('projectId'));
            this.$state.go('projects.pipelineSelectOther', {projectId: this.projectId}, {reload: true});
        } else {
            // create a sortable list of team members if none exists...
            this.selectedMember = '';
            this.team = [];
            this.team.push({'name': this.project.value.pi, 'order': 0, 'guest': false});
            this.project.value.coPis.forEach((c) => {
                this.team.push({'name': c, 'order': 0, 'guest': false});
            });
            this.project.value.teamMembers.forEach((c) => {
                this.team.push({'name': c, 'order': 0, 'guest': false});
            });
            this.project.value.guestMembers.forEach((g) => {
                if (g) {
                    g.order = 0;
                    g.guest = true;
                    this.team.push(g);
                }
            });
            this.team.forEach((t, index) => {
                t.order = index;
            });

            this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
        }
    }

    data() {
        var projectData = {
            title: this.project.value.title,
            uuid: this.project.uuid,
            fileTags: this.project.value.fileTags,
            projectId: this.project.value.projectId,
            projectType: this.project.value.projectType,
            dataType: this.project.value.dataType,
            pi: this.project.value.pi,
            coPis: this.project.value.coPis,
            teamMembers: this.project.value.teamMembers,
            guestMembers: this.project.value.guestMembers,
            teamOrder: this.team,
            awardNumber: this.project.value.awardNumber,
            associatedProjects: this.project.value.associatedProjects,
            description: this.project.value.description,
            keywords: this.project.value.keywords,
        };
        return projectData;
    }

    saveTeam() {
        this.saved = false;
        var prj = this.data();
        this.projectResource.post({ data: prj }).then((resp) => {
            this.project = resp.data;
            this.saved = true;
        });
    }

    orderMembers(up) {
        this.saved = false;
        var a;
        var b;
        if (up) {
            if (this.selectedMember.order <= 0) {
                return;
            }
            // move up
            a = this.team.find(x => x.order === this.selectedMember.order - 1);
            b = this.team.find(x => x.order === this.selectedMember.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedMember.order >= this.team.length - 1) {
                return;
            }
            // move down
            a = this.team.find(x => x.order === this.selectedMember.order + 1);
            b = this.team.find(x => x.order === this.selectedMember.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    goWork() {
        window.sessionStorage.clear();
        this.$state.go('projects.view.data', {projectId: this.project.uuid}, {reload: true});
    }

    goData() {
        this.$state.go('projects.pipelineOther', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

    goLicenses() {
        this.$state.go('projects.pipelineLicenses', {
            projectId: this.projectId,
            project: this.project,
            selectedListings: this.selectedListings,
        }, {reload: true});
    }

}

export const PipelineTeamComponent = {
    template: PipelineTeamTemplate,
    controller: PipelineTeamCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
