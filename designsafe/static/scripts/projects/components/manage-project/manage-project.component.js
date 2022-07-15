import ManageProjectTemplate from './manage-project.template.html';
import AmendProjectTemplate from './amend-project.template.html';
import FormOptions from './project-form-options.json';
import FormDefaults from './project-form-defaults.json';
import { object } from 'underscore';

class ManageProjectCtrl {
    constructor(UserService, ProjectModel, PublicationService, $http, $q, $uibModal, $state) {
        'ngInject';
        this.UserService = UserService;
        this.PublicationService = PublicationService;
        this.ProjectModel = ProjectModel;
        this.$http = $http;
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.ui = {
            hasType: true,
            loading: true,
            editType: true,
            submitting: false,
            error: null,
        };
        this.project = this.resolve.project;
        this.naturalHazardTypes = FormOptions.nhTypes;
        this.fieldResearchTypes = FormOptions.frTypes;
        this.otherTypes = FormOptions.otherTypes;
        this.formDefaults = FormDefaults;

        if (this.project) {
            if (this.project.value.projectType in this.formDefaults) {
                this.form = this.formDefaults[this.project.value.projectType];
            }
            else {
                this.form = this.formDefaults.new;
                this.ui.hasType = false;
            }
            this.form.uuid = this.project.uuid;
            for (const field in this.project.value) {
                if (this.project.value[field] && this.project.value[field].length) {
                    (['nhEventStart', 'nhEventEnd'].includes(field)
                    ? this.form[field] = new Date(this.project.value[field])
                    : this.form[field] = this.project.value[field])
                }
            }
            if (Date.parse(this.form.nhEventStart) == Date.parse(this.form.nhEventEnd)) {
                this.form.nhEventEnd = null;
            }
            const usernames = new Set([
                ...[this.project.value.pi],
                ...this.project.value.coPis,
                ...this.project.value.teamMembers
            ]);
            const promisesToResolve = {
                proj_users: this.UserService.getPublic([...usernames]),
                creator: this.UserService.authenticate()
            };
            this.PublicationService.getPublished(this.project.value.projectId)
                .then((_) => { this.ui.editType = false; });
            this.$q.all(promisesToResolve).then(({proj_users, creator}) => {
                this.form.creator = creator
                this.form.pi = proj_users.userData.find(user => user.username == this.project.value.pi);
                this.form.coPis = proj_users.userData.filter(user => this.project.value.coPis.includes(user.username));
                if (this.project.value.teamMembers.length) {
                    this.form.teamMembers = proj_users.userData.filter(user => this.project.value.teamMembers.includes(user.username));
                }
                this.ui.loading = false;
            });
        } else {
            this.UserService.authenticate().then((creator) => {
                this.form = this.formDefaults.new;
                this.form.creator = creator
                this.ui.loading = false;
            });
        }
    }

    create() {
        this.ui.submitting = true;
        let data = this.prepareData(false);
        if (this.missingCreator(data)) {
            this.confirmMessage().result.then((resp) => {
                if (!resp) {
                    this.ui.submitting = false;
                    return
                }
                this.$http.post(`/api/projects/`, data).then((resp) => {
                    let project = resp.data;
                    this.$state.go(
                        'projects.view',
                        {
                            projectId: project.uuid,
                            filePath: '/',
                            projectTitle: project.value.title
                        },
                        { reload: true }
                    );
                    this.ui.submitting = false;
                    this.close({ $value: project });
                });
            });
        } else {
            this.$http.post(`/api/projects/`, data).then((resp) => {
                let project = resp.data;
                this.$state.go(
                    'projects.view',
                    {
                        projectId: project.uuid,
                        filePath: '/',
                        projectTitle: project.value.title
                    },
                    { reload: true }
                );
                this.ui.submitting = false;
                this.close({ $value: project });
            });
        }
    }

    update() {
        this.ui.submitting = true;
        let data = (this.project.value.projectType === 'None'
            ? this.prepareData(false)
            : this.prepareData(true)
        );
        if (this.missingCreator(data)) {
            this.confirmMessage().result.then((resp) => {
                if (!resp) {
                    this.ui.submitting = false;
                    return
                }
                this.$http.post(`/api/projects/${data.uuid}/`, data).then((resp) => {
                    this.project.value = resp.data.value;
                    this.ui.submitting = false;
                    this.close({ $value: this.project });
                });
            });
        } else {
            this.$http.post(`/api/projects/${data.uuid}/`, data).then((resp) => {
                this.project.value = resp.data.value;
                this.ui.submitting = false;
                this.close({ $value: this.project });
            });
        }
    }

    validInputs(objArray, reqKeys, objValue) {
        /* 
        Validate Inputs
        - check each object provided for defined key values
        - return the object or a value within the object

        objArray - The array of objects to check
        reqKeys  - The required keys for those objects
        objValue - Include if you want to return just the values from the 
                   object array (ex: returning an array of strings
                   from valid objects)
        */
        return objArray.filter((obj) => {
            return obj && reqKeys.every((key) => {
                return typeof obj[key] !== 'undefined' && obj[key] !== '';
            });
        }).map((obj) => {
            return obj[objValue] || obj;
        });
    }

    isRequiredEvent(){
        // console.log('Event ' + this.form.nhEvent)
        // console.log('DtStart ' + this.form.nhEventStart)
        // console.log('Location ' + this.form.nhLocation)
        // console.log('Lat ' + this.form.nhLatitude)
        // console.log('Long ' + this.form.nhLongitude)
        if (this.projectType == 'field_recon'){
            return [console.log('Is Req FR:' + true), true]
            // return true
        } else if ((typeof this.form.nhEvent !== 'undefined')
        || (typeof this.form.nhEventStart !== 'undefined' && this.form.nhEventStart !== null)
        || (typeof this.form.nhLocation !== 'undefined' && this.form.nhLocation !== '')
        || (typeof this.form.nhLatitude !== 'undefined' && this.form.nhLatitude !== '')
        || (typeof this.form.nhLongitude !== 'undefined' && this.form.nhLongitude !== '')
        ){
            return [console.log('Is Req Event:' + true), true]
            // return true
        } else {
            return [ console.log('Is Req None:' + false), false]
            // return false
        }
    }

    prepareData(hasPrjType) {
        let projectData = {...this.form};
        projectData.pi = this.form.pi.username;
        projectData.coPis = this.validInputs(this.form.coPis, ['username'], 'username');
        projectData.teamMembers = this.validInputs(this.form.teamMembers, ['username'], 'username');
        if (hasPrjType) {
            projectData.guestMembers = this.validInputs(this.form.guestMembers, ['fname', 'lname']);
            projectData.awardNumber = this.validInputs(this.form.awardNumber, ['name', 'number']);
            projectData.associatedProjects = this.validInputs(this.form.associatedProjects, ['title', 'href']);
            projectData.guestMembers.forEach((guest, i) => {
                guest.user = "guest" + guest.fname + guest.lname.charAt(0) + i;
            });
            projectData.nhTypes = this.form.nhTypes.filter(type => typeof type === 'string' && type.length);
            if (projectData.projectType === 'field_recon') {
                projectData.frTypes = this.form.frTypes.filter(type => typeof type === 'string' && type.length);
                if (isNaN(Date.parse(projectData.nhEventEnd))) {
                    projectData.nhEventEnd = new Date(projectData.nhEventStart);
                }
            }
        }
        return projectData;
    }

    changeProjectType(warn) {
        this.$uibModal.open({
            component: 'manageProjectType',
            resolve: {
                options: () => { return {'project': this.project, 'warning': warn}; },
            },
            size: 'lg',
        });
        this.close();
    }

    confirmMessage() {
        return this.$uibModal.open({
            component: 'confirmMessage',
            resolve: {
                message: () => `
                    You will not have access to this project if you do
                    not include yourself. Do you want to continue?
                `,
            },
            size: 'sm'
        });
    }

    missingCreator(data) {
        let names = [data.pi, 'prjadmin'].concat(data.coPis, data.teamMembers)
        return !names.includes(this.form.creator.username);
    }

    searchUsers(q) {
        if (q.length > 2) {
            return this.UserService.search({ q: q });
        }
    }

    setDate(dateString) {
        return Date(dateString);
    }

    formatSelection(user) {
        if (user) {
            let first = user.first_name || user.fname
            let last = user.last_name || user.lname
            return first + ' ' + last + ' (' + user.username + ')';
        }
    }

    checkEmpty(group) {
        if (group.length <= 1 && group) {
            return true;
        } else {
            return false;
        }
    }

    addField(group) {
        if (!group.includes(undefined)){
            group.push(undefined);
        }
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

    dropField(group, ordered) {
        if (ordered) {
            group.sort((a, b) => (a.order > b.order) ? 1 : -1);
            group.pop();
        } else {
            group.pop();
        }
    }

    isOther(input, optionsList) {
        // check form options
        if (input === null) {
            return
        }
        let options = optionsList.filter(type => type != 'Other')
        return !options.includes(input) && typeof input !== 'undefined'
    }
}

export const ManageProjectComponent = {
    template: ManageProjectTemplate,
    controller: ManageProjectCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendProjectComponent = {
    template: AmendProjectTemplate,
    controller: ManageProjectCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};