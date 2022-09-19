import _ from 'underscore';
import ManageExperimentsTemplate from './manage-experiments.template.html';
import experimentalData from './experimental-data.json';
import ExperimentDefaults from './experiment-form-defaults.json'

class ManageExperimentsCtrl {

    constructor($q, $http, $uibModal, UserService) {
        'ngInject';
        this.UserService = UserService;
        this.$http = $http;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.experiments = this.project.experiment_set;
        this.edit = this.resolve.edit;
        this.ExperimentDefaults = ExperimentDefaults;
        this.ui = {
            loading: false,
            editing: false,
            require: {
                relatedWork: false,
                referencedData: false,
            },
            relatedWorkTypes: ["Context", "Linked Project"],
            experimentalFacilities: experimentalData.experimentalFacility.experimental,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
        };
        this.configureForm(this.edit);
        this.form.authors = this.configureAuthors(this.edit, false);
    }

    configureForm(experiment) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        let form = structuredClone(this.ExperimentDefaults)
        this.uuid = '';
        this.ui.error = false;
        if (experiment) {
            this.ui.editing = true;
            form.name = experiment.name;
            this.uuid = experiment.uuid;
            for (let key in form) {
                if (experiment.value[key] instanceof Array && experiment.value[key].length) {
                    form[key] = experiment.value[key];
                } else if (['procedureStart', 'procedureEnd'].includes(key)) {
                    form[key] = new Date(experiment.value[key]);
                } else if (typeof experiment.value[key] === 'string' && experiment.value[key]) {
                    form[key] = experiment.value[key];
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

    configureAuthors(experiment, amending) {
        /*  Configure Authors for Experiment Editing
            - check and remove authors from experiments that don't exist on the project
            - format project users as authors for experiment metadata
        */
        if (amending) return structuredClone(experiment.value.authors);

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
        if (experiment) {
            let projectUsers = projectMembers.map((member) => { return member.name });
            let experimentUsers = experiment.value.authors.map((author) => { return author.name });
            // drop members who are no longer listed in the project...
            // add members who are aren't listed in the experiment...
            let currentAuthors = experiment.value.authors.filter((author) => { return projectUsers.includes(author.name) });
            let newAuthors = projectMembers.filter((author) => { return !experimentUsers.includes(author.name) });

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

    addObjField(fieldName) {
        if (this.form[fieldName].length === 1 && !this.ui.require[fieldName]) {
            this.ui.require[fieldName] = true;
        } else {
            this.form[fieldName].push({...this.ExperimentDefaults[fieldName][0]});
        }
    }

    dropObjField(fieldName, index) {
        if (this.form[fieldName].length === 1) {
            this.form[fieldName].pop();
            this.form[fieldName].push({...this.ExperimentDefaults[fieldName][0]});
            this.ui.require[fieldName] = false;
        } else if (Number.isInteger(index)) {
            this.form[fieldName].splice(index,1);
        } else {
            this.form[fieldName].pop();
        }
    }

    getEF(str) {
        let efs = this.ui.experimentalFacilities;
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    requireField(field) {
        // Sets the field to disabled or enabled during init
        if (field.length > 1) return true;
        return (Object.keys(field[0]).every(input => !field[0][input]) ? false : true );
    }

    prepareData() {
        // drop or reformat inputs before for submission
        const fields = [
            'experimentalFacility',
            'experimentType',
            'equipmentType'
        ]
        fields.forEach((field) => {
            if(this.form[field] != 'other') {
                this.form[field+'Other'] = ''
            }
        })
        if (isNaN(Date.parse(this.form.procedureEnd))) {
            this.form.procedureEnd = new Date(this.form.procedureStart);
        }
    }

    createExperiment() {
        this.prepareData();
        const uuid = this.project.uuid;
        const name = 'designsafe.project.experiment';
        this.$http.post(
            `/api/projects/${uuid}/meta/${name}/`,
            { entity: this.form }
        ).then((resp) => {
            this.project.addEntity(resp.data);
            this.experiments = this.project.experiment_set;
            this.resetForm();
        });
    }

    editExperiment(experiment) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.configureForm(experiment);
        this.form.authors = this.configureAuthors(experiment, false);
        if (this.form.procedureEnd &&
            this.form.procedureEnd !== this.form.procedureStart) {
                this.form.procedureEnd = new Date(this.form.procedureEnd);
        } else {
            this.form.procedureEnd = '';
        }
        this.form.procedureStart = new Date(
            this.form.procedureStart
        );
    }

    updateExperiment() {
        this.prepareData();
        let experiment = this.project.getRelatedByUuid(this.uuid);
        const updatedExperiment = { ...experiment, value: this.form };
        this.$http.put(
            `/api/projects/meta/${this.uuid}`,
            {entity: updatedExperiment}
        ).then((resp) => {
            experiment.update(resp.data);
            this.resetForm();
        }).catch((err) => {
            this.ui.error = true;
        });
    }

    deleteExperiment(entity) {
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
                    this.$http.delete(`/api/projects/meta/${entity.uuid}`)
                    .then((resp) => {
                        this.project.removeEntity(resp.data);
                        this.experiments = this.project.experiment_set;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + entity.value.title + "?");
    }
}

export const ManageExperimentsComponent = {
    template: ManageExperimentsTemplate,
    controller: ManageExperimentsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
