import EditProjectTemplate from './edit-project.component.html';
import _ from 'underscore';

class EditProjectCtrl {

    constructor(ProjectService, UserService, httpi, ProjectModel, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.httpi = httpi;
        this.ProjectModel = ProjectModel;
        this.$state = $state;
    }

    $onInit() {
        this.efs = this.resolve.efs;
        this.project = this.resolve.project;
        this.form = {
            copi: new Array (1),
            team: new Array (1),
            guests: new Array (1),
        };
        this.ui = {
            busy: false,
            error: null
        };
        this.rapidEventTypes = [
            'Other',
            'Earthquake',
            'Flood',
            'Hurricane',
            'Landslide',
            'Tornado',
            'Tsunami'
        ];
        this.otherTypes = [
            'Custom',
            'Code',
            'Database',
            'Dataset',
            'Image',
            'Jupyter Notebook',
            'Learning Object',
            'Model',
            'Paper',
            'Proceeding',
            'Poster',
            'Presentation',
            'Report',
            'REU',
            'Softwarem',
            'Survey',
            'Video',
            'White Paper',
        ];
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
        }, {
            id: 'field_recon',
            lable: 'Field Reconnaissance',
        }];
        if (this.project) {
            // project metadata for edit form
            this.form.uuid = this.project.uuid;
            this.form.title = this.project.value.title;
            this.form.projectId = this.project.value.projectId || '';
            this.form.description = this.project.value.description || '';
            this.form.experimentalFacility = this.project.value.experimentalFacility || '';
            this.form.keywords = this.project.value.keywords || '';
            this.form.dataType = this.project.value.dataType || '';
            this.form.fileTags = this.project.value.fileTags || [];
            if (this.form.dataType && this.otherTypes.indexOf(this.form.dataType) === -1) {
                this.form.dataTypeCustom = this.form.dataType;
                this.form.dataType = 'Custom';
            } else {
                this.form.dataTypeCustom = '';
            }
            // project type
            if (typeof this.project.value.projectType != 'undefined') {
                this.form.projectType = _.find(this.projectTypes, (projectType) => { return projectType.id === this.project.value.projectType; });
            }
            // awards
            if (this.project.value.awardNumber.length && typeof this.project.value.awardNumber != 'string') {
                this.form.awardNumber = [];
                this.project.value.awardNumber.forEach((exp) => {
                    if (typeof exp != 'object') {                        
                        if (exp) {
                            this.form.awardNumber = [{name: '', number: exp}];
                        }
                    } else {
                        this.form.awardNumber.push(exp);
                    }
                });
            } else {
                this.form.awardNumber = [{name: this.project.value.awardNumber, number: ''}];
            }
            // related work
            if (this.project.value.associatedProjects.length && typeof this.project.value.associatedProjects != 'string') {
                this.form.associatedProjects = [];
                this.project.value.associatedProjects.forEach((exp) => {
                    if (typeof exp != 'object') {                        
                        if (exp) {
                            this.form.associatedProjects = [{name: '', number: exp}];
                        }
                    } else {
                        this.form.associatedProjects.push(exp);
                    }
                });
            } else {
                this.form.associatedProjects = new Array (1);
            }
            // pi
            this.UserService.get(this.project.value.pi).then((user) => {
                this.form.pi = user;
            });
            // copi
            if (!this.project.value.coPis.length) {
                this.form.copi = new Array (1);
            } else {
                this.form.copi = [];
                this.project.value.coPis.forEach((u) => {
                    this.UserService.get(u).then((user) => {
                        this.form.copi.push(user);
                    });
                });
            }
            // team
            if (!this.project.value.teamMembers.length) {
                this.form.team = new Array (1);
            } else {
                this.form.team = [];
                this.project.value.teamMembers.forEach((u) => {
                    this.UserService.get(u).then((user) => {
                        this.form.team.push(user);
                    });
                });
            }
            // guests
            if (this.project.value.guestMembers.length) {
                this.form.guests = [];
                this.project.value.guestMembers.forEach((usr) => {
                    this.form.guests.push(usr);
                });
            } else {
                this.form.guestMembers = new Array (1);
            }
            if (this.project.value.projectType === 'field_recon') {
                this.form.nhEvent = this.project.value.nhEvent;
                if (this.project.value.nhEventStart) {
                    this.form.nhEventDateStart = new Date(this.project.value.nhEventStart);
                }
                if (this.project.value.nhEventEnd) {
                    this.form.nhEventDateEnd = new Date(this.project.value.nhEventEnd);
                }
                this.form.nhEventType = this.project.value.nhType;
            }
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

    checkAward(award) {
        return typeof award === 'string';
    }

    dropEntity(group) {
        group.pop();
    }

    addEntity(group) {
        group.push(undefined);
    }

    addGuests() {
        this.form.guests.push({});
    }

    cancel() {
        this.close();
    }

    savePrj(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    type (warn) {
        this.ProjectService.manageProjectType({'project': this.project, 'warning': warn});
        this.close();
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
            coPis: [],
            teamMembers: [],
            guestMembers: [],
            fileTags: [],
        };

        if (this.form.nhEvent) {
            projectData.nhEvent = this.form.nhEvent;
        }
        if (this.form.nhEventDateStart){
            projectData.nhEventStart = this.form.nhEventDateStart;
        }
        if (this.form.nhEventDateEnd) {
            projectData.nhEventEnd = this.form.nhEventDateEnd;
        }
        if (this.form.nhEventType) {
            projectData.nhType = this.form.nhEventType;
        }

        // move this to the back end ------------------------------------------------------->
        // we're checking for user objects and empty fields...
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
        i = this.form.guests.length;
        this.form.guestsPrune = [];
        while (i--) {
            if (typeof this.form.guests[i] != 'object') {
                this.form.guests.splice(i, 1);
            } else {
                this.form.guestsPrune.push(this.form.guests[i]);
            }
        }

        if (this.form.uuid) {
            i = this.form.awardNumber.length;
            this.form.awardPrune = [];
            while(i--) {
                if (typeof this.form.awardNumber[i] == 'undefined') {
                    this.form.awardNumber.splice(i, 1);
                } else if (!this.form.awardNumber[i].name.length && !this.form.awardNumber[i].number.length ) {
                    this.form.awardNumber.splice(i, 1);
                } else {
                    this.form.awardPrune.push(this.form.awardNumber[i]);
                }
            }
            i = this.form.associatedProjects.length;
            this.form.workPrune = [];
            while(i--) {
                if (typeof this.form.associatedProjects[i] == 'undefined') {
                    this.form.associatedProjects.splice(i, 1);
                } else if (!this.form.associatedProjects[i].title.length && !this.form.associatedProjects[i].href.length ) {
                    this.form.associatedProjects.splice(i, 1);
                } else {
                    this.form.workPrune.push(this.form.associatedProjects[i]);
                }
            }
        }
        // move this to the back end ------------------------------------------------------->
        if (this.form.pi) {
            projectData.pi = this.form.pi.username;
        }
        if (this.form.copiPrune) {
            this.form.copiPrune.forEach((ent) => {
                projectData.coPis.push(ent.username);
            });
        }
        if (this.form.teamPrune) {
            // this.form.teamPrune = projectData.teamMembers;
            this.form.teamPrune.forEach((ent) => {
                projectData.teamMembers.push(ent.username);
            });
        }
        if (this.form.guests && this.form.guests.indexOf(null) === -1) {
            this.form.guests.forEach((g, i) => {
                // create a "username" for guests
                if (!g.user) {
                    g.user = "guest" + g.fname + g.lname.charAt(0) + i;
                }
            });
            projectData.guestMembers = this.form.guests;
        }
        if (this.form.awardPrune) {
            projectData.awardNumber = this.form.awardPrune;
        }
        if (this.form.workPrune) {
            projectData.associatedProjects = this.form.workPrune;
        }
        if (this.form.projectType && this.form.projectType.id) {
            projectData.projectType = this.form.projectType.id;
        }
        if (this.form.dataType) {
            projectData.dataType = this.form.dataType;
            if (this.form.dataTypeCustom && this.form.dataType === 'Custom') {
                projectData.dataType = this.form.dataTypeCustom;
            }
        }
        if (this.form.fileTags) {
            projectData.fileTags = this.form.fileTags;
        }
        if (this.form.uuid && this.form.uuid) {
            projectData.uuid = this.form.uuid;
        }
        if (typeof this.form.keywords !== 'undefined') {
            projectData.keywords = this.form.keywords;
        }

        this.savePrj(projectData).then((project) => {
            if (this.project) {
                this.project.value = project.value;
            }
            if (!this.form.uuid) {
                this.$state.go(
                    'projects.view.data',	
                    {	
                        projectId: project.uuid,	
                        filePath: '/',	
                        projectTitle: project.value.title	
                    },	
                    {reload: true}	
                );
            }
            this.close({$value: project});
            this.ui.busy = false;
        });
    }
}

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
