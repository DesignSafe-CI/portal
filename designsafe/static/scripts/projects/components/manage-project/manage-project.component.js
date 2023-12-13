import ManageProjectTemplate from './manage-project.template.html';
import AmendProjectTemplate from './amend-project.template.html';
const FormOptions = require('./project-form-options.json');
const FormDefaults = require('./project-form-defaults.json');
const FacilityData = require('../facility-data.json');

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

    // TODO: The project does not update correctly immediately after changing the project type.
    $onInit() {
        this.ui = {
            hasType: true,
            loading: true,
            editType: true,
            submitting: false,
            require: {
                guestMembers: true,
                awardNumber: true,
                associatedProjects: true,
                referencedData: true,
                nhEvents: false,
                coPis: false,
                teamMembers: false,
            },
            requireWorks: true,
            invalidUserError: false,
            invalidUser: '',
            facilities: FacilityData.facility.facilities_list,
        };
        this.project = this.resolve.project;
        this.FormDefaults = FormDefaults;

        if (this.project) {
            let projectCopy = structuredClone(this.project.value);
            this.naturalHazardTypes = FormOptions.nhTypes;
            this.fieldResearchTypes = FormOptions.frTypes;
            this.otherTypes = FormOptions.otherTypes;
            this.relatedWorkTypes = (projectCopy.projectType != 'other' ? FormOptions.rwTypes : FormOptions.rwTypesOther);
            this.facilities= FacilityData.facility.facilities_list;

            if (projectCopy.projectType in this.FormDefaults) {
                this.form = structuredClone(this.FormDefaults[projectCopy.projectType]);
            } else {
                this.form = structuredClone(this.FormDefaults.new);
                this.ui.hasType = false;
            }
            for (let key in this.form) {
                if (projectCopy[key] instanceof Array && projectCopy[key].length){
                    this.form[key] = projectCopy[key];
                } else if (projectCopy[key] instanceof Object && Object.keys(projectCopy[key]).length){
                    this.form[key] = projectCopy[key];
                } else if (['nhEventStart', 'nhEventEnd'].includes(key)) {
                    this.form[key] = (projectCopy[key] ? new Date(projectCopy[key]) : null);
                } else if (typeof projectCopy[key] === 'string' && projectCopy[key]) {
                    this.form[key] = projectCopy[key];
                }
            }
            if (Date.parse(this.form.nhEventStart) == Date.parse(this.form.nhEventEnd)) {
                this.form.nhEventEnd = null;
            }
            this.form.uuid = this.project.uuid;

            const usernames = new Set([
                ...[projectCopy.pi],
                ...projectCopy.coPis,
                ...projectCopy.teamMembers
            ]);
            const promisesToResolve = {
                proj_users: this.UserService.getPublic([...usernames]),
                creator: this.UserService.authenticate()
            };
            this.PublicationService.getPublished(projectCopy.projectId)
                .then((_) => { this.ui.editType = false; });
            this.$q.all(promisesToResolve).then(({proj_users, creator}) => {
                this.form.creator = creator
                this.form.pi = proj_users.userData.find(user => user.username == projectCopy.pi);
                let copis = proj_users.userData.filter(user => projectCopy.coPis.includes(user.username));
                let team = proj_users.userData.filter(user => projectCopy.teamMembers.includes(user.username));
                if (copis.length) {
                    this.form.coPis = copis;
                    this.ui.require.coPis = true;
                };
                if (team.length) {
                    this.form.teamMembers = team;
                    this.ui.require.teamMembers = true;
                };
                if (this.form.projectType in this.FormDefaults) {
                    this.ui.require.guestMembers = this.requireField(this.form.guestMembers);
                    this.ui.require.awardNumber = this.requireField(this.form.awardNumber);
                    this.ui.require.nhEvents = this.requireEvent();
                    if (this.form.projectType === 'other') {
                        this.ui.require.associatedProjects = this.requireField(this.form.associatedProjects);
                        this.ui.require.referencedData = this.requireField(this.form.referencedData);
                    }
                }
                this.ui.loading = false;
            });
        } else {
            this.UserService.authenticate().then((creator) => {
                this.form = structuredClone(this.FormDefaults.new);
                this.form.creator = creator
                this.ui.loading = false;
            });
        }
    }

    create() {
        let users = [this.form.pi].concat(this.form.coPis, this.form.teamMembers);
        this.ui.invalidUser = users.find(usr => typeof usr != 'object');
        if (this.ui.invalidUser) return this.ui.invalidUserError = true;

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

    prepareData(hasPrjType) {
        let projectData = {...this.form};
        projectData.pi = this.form.pi.username;
        projectData.coPis = this.validInputs(this.form.coPis, ['username'], 'username');
        projectData.teamMembers = this.validInputs(this.form.teamMembers, ['username'], 'username');
        if (projectData['facility'] != 'other') {
            projectData['facilityOther'] = '';
        }
        if (hasPrjType) {
            projectData.guestMembers = this.validInputs(this.form.guestMembers, ['fname', 'lname']);
            projectData.awardNumber = this.validInputs(this.form.awardNumber, ['name', 'number']);
            if (this.form.projectType === 'other') {
                projectData.associatedProjects = this.validInputs(this.form.associatedProjects, ['title', 'href']);
                projectData.referencedData = this.validInputs(this.form.referencedData, ['title', 'doi']);

                const facilities = this.form.facilities.filter((fac) => fac && !!fac.id).map((fac) => {
                    if (fac.id === 'other') {
                        return {id: 'other', name: fac.name}
                    } else {
                        return {id: fac.id, name: this.ui.facilities.find((f) => f.name === fac.id).label}
                    }
                });

                projectData.facilities = facilities

            } else {
                if ('associatedProjects' in projectData) {
                    projectData.associatedProjects = [];
                }
                if ('referencedData' in projectData) {
                    projectData.referencedData = [];
                }
            }
            projectData.guestMembers.forEach((guest, i) => {
                guest.user = "guest" + guest.fname + guest.lname.charAt(0) + i;
            });
            projectData.nhTypes = this.form.nhTypes.filter(type => typeof type === 'string' && type.length);
            
            if (projectData.projectType === 'field_recon') {
                projectData.frTypes = this.form.frTypes.filter(type => typeof type === 'string' && type.length);
            }
            let fields = ["nhEvent", "nhLocation", "nhLongitude", "nhLatitude"];
            let result = fields.every((field) => {return typeof projectData[field] === 'string' && projectData[field].length})
            let checkDate = isNaN(Date.parse(projectData.nhEventStart))
            if (!result || checkDate) {
                fields.forEach((field) => projectData[field] = '')
                projectData.nhEventStart = '';
                projectData.nhEventEnd = '';
            }
            else {
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

    requireEvent() {
        const eventFields = [
            "nhEventStart",
            "nhEventEnd",
            "nhEvent",
            "nhLocation",
            "nhLatitude",
            "nhLongitude"
        ]
        return eventFields.some((field) => this.form[field]);
    }

    dropEvent(){
        const eventFields = [
            "nhEventStart",
            "nhEventEnd",
            "nhEvent",
            "nhLocation",
            "nhLatitude",
            "nhLongitude"
        ]
        eventFields.forEach((field) => {
            if (field == "nhEventStart" || field == "nhEventEnd") {
                this.form[field] = null;
            }
            this.form[field] = '';
        })
        this.ui.require.nhEvents = false;
    }

    requireField(field) {
        // Sets the field to disabled or enabled during init
        if (field.length > 1) return true;
        return (Object.keys(field[0]).every(input => !field[0][input]) ? false : true );
    }

    addObjField(fieldName) {
        if (this.form[fieldName].length === 1 && !this.ui.require[fieldName]) {
            this.ui.require[fieldName] = true;
        } else {
            this.form[fieldName].push({...this.FormDefaults[this.form.projectType][fieldName][0]});
        }
    }

    dropObjField(fieldName, index) {
        if (this.form[fieldName].length === 1) {
            this.form[fieldName].pop();
            this.form[fieldName].push({...this.FormDefaults[this.form.projectType][fieldName][0]});
            this.ui.require[fieldName] = false;
        } else if (Number.isInteger(index)) {
            this.form[fieldName].splice(index,1);
        } else {
            this.form[fieldName].pop();
        }
    }

    getEF(str) {
        console.log(this.ui.facilities)
        if (str !='' && str !='None') {
            let efs = this.ui.facilities;
            let ef = efs.find((ef) => {
                return ef.name === str;
            });
            return ef.label;
        }
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    addUserField(userType) {
        if (this.form[userType].length === 1 && !this.ui.require[userType]) {
            this.ui.require[userType] = true;
        } else {
            this.form[userType].push(null);
        }
    }

    dropUserField(userType, index) {
        if (this.form[userType].length === 1) {
            this.form[userType].pop();
            this.form[userType].push(null);
            this.ui.require[userType] = false;
        } else if (Number.isInteger(index)) {
            this.form[userType].splice(index,1);
        } else {
            this.form[userType].pop();
        }
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