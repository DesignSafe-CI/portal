import ManageFieldReconMissionsTemplate from './manage-field-recon-missions.template.html';
const MissionDefaults = require('./mission-form-defaults.json');

class ManageFieldReconMissionsCtrl {

    constructor(ProjectEntitiesService, $uibModal) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.missions = this.project.mission_set;
        this.edit = this.resolve.edit;
        this.MissionDefaults = MissionDefaults;
        this.ui = {
            loading: false,
            editing: false,
            relatedWorkTypes: ["Context", "Linked Project"],
            require: {
                relatedWork: false,
                referencedData: false,
            }
        };
        this.configureForm(this.edit);
        this.form.authors = this.configureAuthors(this.edit, false);
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
            this.form[fieldName].push({title: '', doi: ''});
        }
    }

    dropObjField(fieldName, index) {
        if (this.form[fieldName].length === 1) {
            this.form[fieldName].pop();
            this.form[fieldName].push({title: '', doi: ''});
            this.ui.require[fieldName] = false;
        } else if (Number.isInteger(index)) {
            this.form[fieldName].splice(index, 1);
        } else {
            this.form[fieldName].pop();
        }
    }
    
    configureForm(mission) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        let form = structuredClone(this.MissionDefaults)
        this.uuid = '';
        this.ui.error = false;
        if (mission) {
            this.ui.editing = true;
            form.name = mission.name;
            this.uuid = mission.uuid;
            for (let key in form) {
                if (mission.value[key] instanceof Array && mission.value[key].length) {
                    form[key] = mission.value[key];
                } else if (['dateStart', 'dateEnd'].includes(key)) {
                    form[key] = new Date(mission.value[key]);
                } else if (typeof mission.value[key] === 'string' && mission.value[key]) {
                    form[key] = mission.value[key];
                }
            }
        }
        this.ui.require.relatedWork = this.requireField(form.relatedWork);
        this.ui.require.referencedData = this.requireField(form.referencedData);
        this.form = structuredClone(form);
    }

    resetForm() {
        this.configureForm();
        this.form.authors = this.configureAuthors(null, false);
        this.ui.editing = false;
    }

    configureAuthors(mission, amending) {
        /*  Configure Authors for Mission Editing
            - check and remove authors from missions that don't exist on the project
            - format project users as authors for mission metadata
        */
        if (amending) return structuredClone(mission.value.authors);

        let projectMembers = [this.project.value.pi].concat(
            this.project.value.coPis,
            this.project.value.teamMembers,
            this.project.value.guestMembers
        );
        projectMembers = projectMembers.map((member, i) => {
            if (typeof member == 'string') {
                // registered users
                return { name: member, order: i, authorship: false };
            } else {
                // nonregistered users
                return {
                    name: member.user,
                    order: i,
                    authorship: false,
                    guest: true,
                    fname: member.fname,
                    lname: member.lname,
                    email: member.email,
                    inst: member.inst,
                };
            };
        });
        if (mission) {
            let projectUsers = projectMembers.map((member) => { return member.name });
            let missionUsers = mission.value.authors.map((author) => { return author.name });
            // drop members who are no longer listed in the project...
            // add members who are aren't listed in the mission...
            let currentAuthors = mission.value.authors.filter((author) => { return projectUsers.includes(author.name) });
            let newAuthors = projectMembers.filter((author) => { return !missionUsers.includes(author.name) });

            //combine and return unique
            let authors = currentAuthors.concat(newAuthors);
            authors.forEach((author, i) => { author.order = i });
            return structuredClone(authors);
        }
        return structuredClone(projectMembers);
    }

    editAuthors(user, i) {
        if (document.getElementById('editAuthor' + i).checked) {
            user.authorship = true;
        } else {
            user.authorship = false;
        }
    }

    validAuthors(){
        for(let i = 0; i < this.form.authors.length; i++) {
            if (this.form.authors[i].authorship === true) {
                return false;
            }
        }
        return true;
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

    prepareData() {
        // drop or reformat inputs before for submission
        if (isNaN(Date.parse(this.form.dateEnd))) {
            this.form.dateEnd = new Date(this.form.dateStart);
        }
        this.form.relatedWork = this.validInputs(this.form.relatedWork, ['title', 'href']);
        this.form.referencedData = this.validInputs(this.form.referencedData, ['title', 'doi']);
    }

    createMission() {
        this.prepareData();
        const uuid = this.project.uuid;
        const name = 'designsafe.project.field_recon.mission';
        this.ProjectEntitiesService.create({
            data: { uuid: uuid, name: name, entity: this.form }
        })
        .then((resp) => {
            this.project.addEntity(resp);
            this.missions = this.project.mission_set;
            this.resetForm();
        });
    }

    editMission(mission) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.configureForm(mission);
        this.form.authors = this.configureAuthors(mission, false);
        if (this.form.dateEnd &&
            this.form.dateEnd !== this.form.dateStart) {
                this.form.dateEnd = new Date(this.form.dateEnd);
        } else {
            this.form.dateEnd = '';
        }
        this.form.dateStart = new Date(
            this.form.dateStart
        );
    }

    updateMission() {
        this.prepareData();
        let mission = this.project.getRelatedByUuid(this.uuid);
        const updatedMission = { ...mission, value: this.form };
        this.ProjectEntitiesService.update({
            data: { uuid: this.uuid, entity: updatedMission }
        })
        .then((resp) => {
            mission.update(resp);
            this.resetForm();
        })
        .catch((err) => {
            this.ui.error = true;
        });
    }

    deleteMission(mission) {
        let confirmDelete = (msg) => {
            let modalInstance = this.$uibModal.open({
                component: 'confirmMessage',
                resolve: {
                    message: () => msg,
                },
                size: 'sm'
            });

            modalInstance.result.then((res) => {
                if (res) {
                    this.ProjectEntitiesService.delete({
                        data: { uuid: mission.uuid }
                    })
                    .then((resp) => {
                        this.project.removeEntity(resp);
                        this.missions = this.project.mission_set;
                    });
                }
            });
        };
        confirmDelete(`Are you sure you want to delete ${mission.value.title}?`);
    }
}

export const ManageFieldReconMissionsComponent = {
    template: ManageFieldReconMissionsTemplate,
    controller: ManageFieldReconMissionsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    }
};
