import ManageSimulationTemplate from './manage-simulations.template.html';
const SimulationDefaults = require('./simulation-form-defaults.json');
const SimulationTypes = require('./simulation-types.json');

class ManageSimulationCtrl {

    constructor(ProjectEntitiesService, $uibModal) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.simulations = this.project.simulation_set;
        this.edit = this.resolve.edit;
        this.SimulationDefaults = SimulationDefaults;
        this.ui = {
            loading: false,
            editing: false,
            require: {
                relatedWork: false,
                referencedData: false,
            },
            relatedWorkTypes: ["Context", "Linked Dataset", "Cited By"],
        };
        this.configureForm(this.edit);
        this.form.authors = this.configureAuthors(this.edit, false);
    }

    configureForm(simulation) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        let form = structuredClone(this.SimulationDefaults)
        this.uuid = '';
        this.ui.error = false;
        if (simulation) {
            this.ui.editing = true;
            form.name = simulation.name;
            this.uuid = simulation.uuid;
            for (let key in form) {
                if (simulation.value[key] instanceof Array && simulation.value[key].length) {
                    form[key] = simulation.value[key];
                } else if (typeof simulation.value[key] === 'string' && simulation.value[key]) {
                    form[key] = simulation.value[key];
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

    configureAuthors(simulation, amending) {
        /*  Configure Authors for Simulation Editing
            - check and remove authors from simulations that don't exist on the project
            - format project users as authors for simulation metadata
        */
        if (amending) return structuredClone(simulation.value.authors);

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
        if (simulation) {
            let projectUsers = projectMembers.map((member) => { return member.name });
            let simulationUsers = simulation.value.authors.map((author) => { return author.name });
            // drop members who are no longer listed in the project...
            // add members who are aren't listed in the simulation...
            let currentAuthors = simulation.value.authors.filter((author) => { return projectUsers.includes(author.name) });
            let newAuthors = projectMembers.filter((author) => { return !simulationUsers.includes(author.name) });

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

    addObjField(fieldName) {
        if (this.form[fieldName].length === 1 && !this.ui.require[fieldName]) {
            this.ui.require[fieldName] = true;
        } else {
            this.form[fieldName].push({...this.SimulationDefaults[fieldName][0]});
        }
    }

    dropObjField(fieldName, index) {
        if (this.form[fieldName].length === 1) {
            this.form[fieldName].pop();
            this.form[fieldName].push({...this.SimulationDefaults[fieldName][0]});
            this.ui.require[fieldName] = false;
        } else if (Number.isInteger(index)) {
            this.form[fieldName].splice(index,1);
        } else {
            this.form[fieldName].pop();
        }
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
        if(this.form.simulationType != 'other') {
            this.form.simulationTypeOther = '';
        }
        this.form.relatedWork = this.validInputs(this.form.relatedWork, ['title', 'href']);
        this.form.referencedData = this.validInputs(this.form.referencedData, ['title', 'doi']);
    }

    createSimulation() {
        this.prepareData();
        const uuid = this.project.uuid;
        const name = 'designsafe.project.simulation';
        this.ProjectEntitiesService.create({
            data: { uuid: uuid, name: name, entity: this.form }
        })
        .then((resp) => {
            this.project.addEntity(resp);
            this.simulations = this.project.simulation_set;
            this.resetForm();
        });
    }

    editSimulation(simulation) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.configureForm(simulation);
        this.form.authors = this.configureAuthors(simulation, false);
    }

    updateSimulation() {
        this.prepareData();
        let simulation = this.project.getRelatedByUuid(this.uuid);
        const updatedSimulation = { ...simulation, value: this.form };
        this.ProjectEntitiesService.update({
            data: { uuid: this.uuid, entity: updatedSimulation }
        })
        .then((resp) => {
            simulation.update(resp);
            this.resetForm();
        })
        .catch((err) => {
            this.ui.error = true;
        });
    }

    deleteSimulation(simulation) {
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
                        data: { uuid: simulation.uuid }
                    })
                    .then((resp) => {
                        this.project.removeEntity(resp);
                        this.simulations = this.project.simulation_set;
                    });
                }
            });
        };
        confirmDelete(`Are you sure you want to delete ${simulation.value.title}?`);
    }
}

export const ManageSimulationComponent = {
    template: ManageSimulationTemplate,
    controller: ManageSimulationCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}