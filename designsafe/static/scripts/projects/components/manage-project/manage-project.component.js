import ManageProjectTemplate from './manage-project.template.html';
import FormOptions from './project-form-options.json';
import FormDefaults from './project-form-defaults.json';

class ManageProjectCtrl {
    constructor(UserService, ProjectModel, $http, $q, $uibModal, $state) {
        'ngInject';
        this.UserService = UserService;
        this.ProjectModel = ProjectModel;
        this.$http = $http;
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.$state = $state;
    }

    $onInit() {
        this.ui = {
            loading: true,
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
            } else {
                this.form = this.formDefaults.none
            }

            this.form.uuid = this.project.uuid
            for (const field in this.project.value) {
                if (this.project.value[field] && this.project.value[field].length) {
                    this.form[field] = this.project.value[field];
                }
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
            this.form = this.formDefaults.new;
            this.ui.loading = false;
        }
    }

    create(data) {
        return this.$http.post(`/api/projects/`, data).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    update(uuid, data) {
        return this.$http.post(`/api/projects/${uuid}/`, data).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
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

    checkInputs() {
        this.ui.loading = true;
        let projectData = {...this.form};
        projectData.pi = this.form.pi.username;
        projectData.coPis = this.validInputs(this.form.coPis, ['username'], 'username');
        projectData.teamMembers = this.validInputs(this.form.teamMembers, ['username'], 'username');
        if (this.form.uuid) {
            projectData.guestMembers = this.validInputs(this.form.guestMembers, ['fname', 'lname']);
            projectData.awardNumber = this.validInputs(this.form.awardNumber, ['name', 'number']);
            projectData.associatedProjects = this.validInputs(this.form.associatedProjects, ['title', 'href']);
            projectData.guestMembers.forEach((guest, i) => {
                guest.user = "guest" + guest.fname + guest.lname.charAt(0) + i;
            });
            projectData.nhTypes = this.form.nhTypes.filter(type => typeof type === 'string' && type.length);
            if (projectData.projectType === 'field_recon') {
                projectData.frTypes = this.form.frTypes.filter(type => typeof type === 'string' && type.length);
            }

            /*
            Bookmark:
            - Make sure that changing the project type clears all of the meta fields (except the users).
            - Move update and create methods so that we don't have to check for form uuid here.
              Revert back to the two save buttons to determine update or create
            - Keep checkInputs to only checking inputs
            - Test the creation of a project
            - Test the change of a project type
            - Test saving a Field Research project
            - Test saving an Experimental project
            - Replace the ProjectService.editProject() calls...
            */

            this.update(projectData.uuid, projectData).then((project) => {
                this.project.value = project.value;
                this.ui.loading = false;
                this.close({ $value: project });
            });
        } else {
            this.create(projectData).then((project) => {
                this.$state.go(
                    'projects.view',
                    {
                        projectId: project.uuid,
                        filePath: '/',
                        projectTitle: project.value.title
                    },
                    { reload: true }
                );
                this.ui.loading = false;
                this.close({ $value: project });
            });
        }
    }

    creatorInProject(data) {
        let names = [data.pi, 'prjadmin'].concat(data.coPis, data.teamMembers)
        return names.includes(this.form.creator);
    }

    projectType(warn) {
        this.$uibModal.open({
            component: 'manageProjectType',
            resolve: {
                options: () => { return {'project': this.project, 'warning': warn}; },
            },
            size: 'lg',
        });
        this.close();
    }

    searchUsers(q) {
        if (q.length > 2) {
            return this.UserService.search({ q: q });
        }
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