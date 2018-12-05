import EditProjectTemplate from './edit-project.component.html';
import _ from 'underscore';

class EditProjectCtrl {

    constructor(UserService, httpi, ProjectModel) {
        'ngInject';
        this.UserService = UserService;
        this.httpi = httpi;
        this.ProjectModel = ProjectModel;
    }

    $onInit() {
        this.efs = this.resolve.efs;
        this.project = this.resolve.project;
        this.form = {
            associatedProjectsAdded: [],
            copi: new Array (1),
            team: new Array (1),
        };
        this.ui = {
            busy: false,
            error: null
        };
        this.projectTypes = [{
            id: 'experimental',
            label: 'Experimental'
        }, {
            id: 'simulation',
            label: 'Simulation'
        }, {
            id: 'hybrid_simulation',
            label: 'Hybrid Simulation'
        }, {
            id: 'other',
            label: 'Other'
        }];
        if (this.project) {
            this.form.uuid = this.project.uuid;
            this.form.title = this.project.value.title;
            // this.form.awardNumber = this.project.value.awardNumber || '';
            if (typeof this.project.value.awardNumber != 'object') {
                this.form.awardNumber = new Array (1);
                if (this.project.value.awardNumber) {
                    this.form.awardNumber = [{name: '', number: this.project.value.awardNumber}];
                }
            }
            this.form.projectId = this.project.value.projectId || '';
            this.form.description = this.project.value.description || '';
            this.form.experimentalFacility = this.project.value.experimentalFacility || '';
            this.form.keywords = this.project.value.keywords || '';
            if (typeof this.project.value.projectType !== 'undefined') {
                this.form.projectType = _.find(this.projectTypes, (projectType) => { return projectType.id === this.project.value.projectType; });
            }
            if (typeof this.project.value.associatedProjects !== 'undefined') {
                this.form.associatedProjects = _.filter(this.project.value.associatedProjects, (associatedProject) => { return typeof associatedProject.title !== 'undefined' && associatedProject.title.length > 0; });
            }
            this.UserService.get(this.project.value.pi).then((user) => {
                this.form.pi = user;
            });
            this.form.copi = [];
            this.project.value.coPis.forEach((u) => {
                this.UserService.get(u).then((user) => {
                    this.form.copi.push(user);
                });
            });
            this.form.team = [];
            this.project.value.teamMembers.forEach((u) => {
                this.UserService.get(u).then((user) => {
                    this.form.team.push(user);
                });
            });
        }
        this.UserService.authenticate().then((u) => {
            this.form.creator = u;
        });
        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    }

    searchUsers(q) {
        return this.UserService.search({ q: q });
    }

    formatSelection(user) {
        if (user) {
            return user.first_name +
                ' ' + user.last_name +
                ' (' + user.username + ')';
        }
    }

    checkEmpty(group) {
        if (group.length <= 1 && group) {
            return true;
        } else {
            return false;
        }
    }

    checkValid(usr) {
        if (usr && usr.username) {
            return true;
        }
        return false;
    }

    dropUser(group) {
        group.pop();
    }

    addUser(group) {
        group.push(undefined);
    }

    addAssociatedProject() {
        this.form.associatedProjectsAdded.push({});
    }

    cancel() {
        this.dismiss();
    }

    savePrj(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    save() {
        if (!this.checkValid(this.form.pi)) {
            return this.form.pi = undefined;
        }
        this.ui.busy = true;
        var projectData = {
            title: this.form.title,
            awardNumber: this.form.awardNumber,
            description: this.form.description,
            projectId: this.form.projectId,
            copi: [],
            team: [],
        };

        var i = this.form.copi.length;
        this.form.copiPrune = [];
        while(i--) {
            if (typeof this.form.copi[i] != 'object') {
                this.form.copi.splice(i, 1);
            } else {
                this.form.copiPrune.push(this.form.copi[i]);
            }
        }
        i = this.form.team.length;
        this.form.teamPrune = [];
        while(i--) {
            if (typeof this.form.team[i] != 'object') {
                this.form.team.splice(i, 1);
            } else {
                this.form.teamPrune.push(this.form.team[i]);
            }
        }

        if (this.form.pi) {
            projectData.pi = this.form.pi;
        }
        if (this.form.copiPrune) {
            this.form.copiPrune.forEach((c) => {
                projectData.copi.push(c.username);
            });
        }
        if (this.form.teamPrune) {
            this.form.teamPrune.forEach((u) => {
                projectData.team.push(u.username);
            });
        }
        if (this.form.projectType && this.form.projectType.id) {
            projectData.projectType = this.form.projectType.id;
        }
        if (this.form.uuid && this.form.uuid) {
            projectData.uuid = this.form.uuid;
        }
        if (typeof this.form.associatedProjectsAdded !== 'undefined') {
            this.form.associatedProjectsAdded = _.filter(this.form.associatedProjectsAdded, (associatedProject) => { return typeof associatedProject.title !== 'undefined' && associatedProject.title.length > 0; });
            projectData.associatedProjects = this.form.associatedProjects || [];
            projectData.associatedProjects = _.filter(projectData.associatedProjects, (associatedProject) => { return !associatedProject.delete; });
            projectData.associatedProjects = projectData.associatedProjects.concat(this.form.associatedProjectsAdded);
        }
        if (typeof this.form.keywords !== 'undefined') {
            projectData.keywords = this.form.keywords;
        }
        console.log(projectData);
        // this.savePrj(projectData).then((project) => {
        //     this.close(project);
        //     this.ui.busy = false;
        // });
    }
}

EditProjectCtrl.$inject = ['UserService', 'httpi', 'ProjectModel'];

export const EditProjectComponent = {
    template: EditProjectTemplate,
    controller: EditProjectCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
