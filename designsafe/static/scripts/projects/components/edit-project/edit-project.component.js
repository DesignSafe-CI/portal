import EditProjectTemplate from './edit-project.component.html';
import _ from 'underscore';

class EditProjectCtrl {

    constructor(ProjectService, UserService, httpi, ProjectModel, $uibModal, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.httpi = httpi;
        this.ProjectModel = ProjectModel;
        this.$uibModal = $uibModal;
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
            'Social Sciences',
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
            lable: 'Field Research',
        }];

        this.hasOrder = (items) => {
            for (let i = 0; i < items.length; i++) {
                if (typeof items[i].order == 'undefined') {
                    return false;
                }
            }
            return true;
        };
        this.setOrder = (items) => {
            let inc = 0;
            for (let i = 0; i < items.length; i++) {
                items[i].order = inc;
                inc ++;
            }
        };

        if (this.project) {
            // project metadata for edit form
            this.form.uuid = this.project.uuid;
            this.form.title = this.project.value.title;
            this.form.projectId = this.project.value.projectId || '';
            this.form.description = this.project.value.description || '';
            this.form.experimentalFacility = this.project.value.experimentalFacility || '';
            this.form.keywords = this.project.value.keywords || '';
            this.form.dataType = this.project.value.dataType || null;
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
                this.project.value.awardNumber.forEach((awrd) => {
                    if (typeof awrd != 'object') {
                        if (awrd) {
                            this.form.awardNumber = [{name: '', number: awrd}];
                        }
                    } else {
                        this.form.awardNumber.push(awrd);
                    }
                });
                if (!this.hasOrder(this.form.awardNumber)) {
                    this.setOrder(this.form.awardNumber);
                }
            } else {
                this.form.awardNumber = [{name: this.project.value.awardNumber, number: ''}];
            }
            // related work
            if (this.project.value.associatedProjects.length && typeof this.project.value.associatedProjects != 'string') {
                this.form.associatedProjects = [];
                this.project.value.associatedProjects.forEach((aprj) => {
                    if (typeof aprj != 'object') {
                        if (aprj) {
                            this.form.associatedProjects = [{title: '', href: aprj}];
                        }
                    } else {
                        this.form.associatedProjects.push(aprj);
                    }
                });
                if (!this.hasOrder(this.form.associatedProjects)) {
                    this.setOrder(this.form.associatedProjects);
                }
            } else {
                this.form.associatedProjects = [{title: '', href: ''}];
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
                    if (this.project.value.nhEventStart === this.project.value.nhEventEnd) {
                        this.form.nhEventDateEnd = '';
                    } else {
                        this.form.nhEventDateEnd = new Date(this.project.value.nhEventEnd);
                    }
                }
                if (this.project.value.nhTypes && this.project.value.nhTypes.length > 0) {
                    this.form.nhTypes = [];
                    this.form.nhTypesOther = [];
                    this.project.value.nhTypes.forEach((type) => {
                        if (!this.isNhTypeInDropdown(type)) {
                            this.form.nhTypes.push("Other");
                            this.form.nhTypesOther.push(type);
                        } else {
                            this.form.nhTypes.push(type);
                            this.form.nhTypesOther.push(null);
                        }
                    });
                } else {
                    this.form.nhTypes = new Array (1);
                    this.form.nhTypesOther = [null];
                }
                if (this.project.value.nhLocation && this.project.value.nhLatitude && this.project.value.nhLongitude) {
                    this.form.nhLocation = this.project.value.nhLocation;
                    this.form.nhLatitude = this.project.value.nhLatitude;
                    this.form.nhLongitude = this.project.value.nhLongitude;
                }
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

    dropField(group, ordered) {
        if (ordered) {
            group.sort((a, b) => (a.order > b.order) ? 1 : -1);
            group.pop();
        } else {
            group.pop();
        }
    }

    dropEventType() {
        this.form.nhTypes.pop();
        this.form.nhTypesOther.pop();
    }

    addField(group) {
        group.push(undefined);
    }

    addAwardField(group) {
        group.push({
            "name": undefined,
            "number": undefined,
            "order": group.length + 1
        });
    }

    addWorkField(group) {
        group.push({
            "title": undefined,
            "href": undefined,
            "order": group.length + 1
        });
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
        this.$uibModal.open({
            component: 'manageProjectType',
            resolve: {
                options: () => { return {'project': this.project, 'warning': warn}; },
            },
            size: 'lg',
        });
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
        } else if (this.form.nhEventDateStart && !this.form.nhEventDateEnd) {
            projectData.nhEventEnd = this.form.nhEventDateStart;
        }
        if (this.form.nhLocation && this.form.nhLatitude && this.form.nhLongitude) {
            projectData.nhLocation = this.form.nhLocation;
            projectData.nhLatitude = this.form.nhLatitude;
            projectData.nhLongitude = this.form.nhLongitude;
        }
        if (this.form.nhTypes) {
            projectData.nhTypes = this.form.nhTypes
            .map((type, index) => {
                if(type === 'Other') {
                    return this.form.nhTypesOther[index];
                }
                return type;
            })
            .filter(input => input);
        }

        // clear any empty inputs...
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
                if (typeof this.form.awardNumber[i] === 'undefined') {
                    this.form.awardNumber.splice(i, 1);
                } else if (typeof this.form.awardNumber[i].name === 'undefined' &&
                           typeof this.form.awardNumber[i].number === 'undefined' ) {
                    this.form.awardNumber.splice(i, 1);
                } else if (this.form.awardNumber[i].name === "" &&
                           this.form.awardNumber[i].number === "" ) {
                    this.form.awardNumber.splice(i, 1);
                } else {
                    this.form.awardPrune.push(this.form.awardNumber[i]);
                }
            }
            i = this.form.associatedProjects.length;
            this.form.workPrune = [];
            while(i--) {
                if (typeof this.form.associatedProjects[i] === 'undefined') {
                    this.form.associatedProjects.splice(i, 1);
                } else if (typeof this.form.associatedProjects[i].title === 'undefined' &&
                           typeof this.form.associatedProjects[i].href === 'undefined' ) {
                    this.form.associatedProjects.splice(i, 1);
                } else if (this.form.associatedProjects[i].title === '' &&
                           this.form.associatedProjects[i].href === '' ) {
                    this.form.associatedProjects.splice(i, 1);
                } else {
                    this.form.workPrune.push(this.form.associatedProjects[i]);
                }
            }
        }
        if (this.form.pi) {
            projectData.pi = this.form.pi.username;
        }
        if (this.form.copiPrune) {
            this.form.copiPrune.forEach((ent) => {
                projectData.coPis.push(ent.username);
            });
        }
        if (this.form.teamPrune) {
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
                if (g.lname && g.fname) {
                    projectData.guestMembers.push(g);
                }
            });
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
        if (!projectData.teamMembers.concat(projectData.coPis, [projectData.pi]).includes(this.form.creator.username) && this.form.uuid) {
            this.modalInstance = this.$uibModal.open({
                component: 'confirmMessage',
                resolve: {
                    message: () => "Are you sure you want to remove yourself from the project?",
                },
                size: 'sm'
            });
            this.modalInstance.result.then((res) => {
                if (!res) {
                    this.ui.busy = false;
                } else {
                    this.savePrj(projectData).then((project) => {
                        if (this.project) {
                            this.project.value = project.value;
                        }
                        this.$state.go('', { reload: true });
                        this.close({ $value: project });
                        this.ui.busy = false;
                    });
                }
            });
        } else {
            this.savePrj(projectData).then((project) => {
                if (this.project) {
                    this.project.value = project.value;
                }
                if (!this.form.uuid) {
                    this.$state.go(
                        'projects.view',
                        {
                            projectId: project.uuid,
                            filePath: '/',
                            projectTitle: project.value.title
                        },
                        { reload: true }
                    );
                }
                this.close({ $value: project });
                this.ui.busy = false;
            });
        }

    }

    isNhTypeInDropdown(type) {
        return this.rapidEventTypes.includes(type) && type !== 'Other';
    }

    showNhTypesDropdown($index) {
        return (this.isNhTypeInDropdown(this.form.nhTypes[$index]) ||
                !this.form.nhTypes[$index]);
    }

    showNhTypesInput($index) {
        return (this.form.nhTypes[$index] === 'Other' ||
                (!this.isNhTypeInDropdown(this.form.nhTypes[$index]) &&
                 this.form.nhTypes[$index]));
    }

    addNhType() {
        let last = this.form.nhTypes.length - 1;
        if (this.form.nhTypes[last]) {
            this.form.nhTypes.push(null);
        }
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
