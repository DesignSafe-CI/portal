import ManageHybridSimTemplate from './manage-hybrid-simulations.template.html';
const HybridSimDefaults = require('./hybrid-sim-form-defaults.json');
const HybridSimTypes = require('./hybrid-simulation-types.json');
const FacilityData = require('../facility-data.json');

class ManageHybridSimCtrl {

    constructor(ProjectEntitiesService, $uibModal) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.hybridSims = this.project.hybridsimulation_set;
        this.edit = this.resolve.edit;
        this.HybridSimDefaults = HybridSimDefaults;
        this.ui = {
            loading: false,
            editing: false,
            require: {
                relatedWork: false,
                referencedData: false,
            },
            relatedWorkTypes: ["Context", "Linked Dataset", "Cited By"],
            hybridSimTypes: HybridSimTypes,
            facilities: FacilityData.facility.facilities_list,
        };
        this.configureForm(this.edit);
        this.form.authors = this.configureAuthors(this.edit, false);
    }

    configureForm(hybridSim) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        let form = structuredClone(this.HybridSimDefaults)
        this.uuid = '';
        this.ui.error = false;
        if (hybridSim) {
            this.ui.editing = true;
            form.name = hybridSim.name;
            this.uuid = hybridSim.uuid;
            for (let key in form) {
                if (hybridSim.value[key] instanceof Array && hybridSim.value[key].length) {
                    form[key] = hybridSim.value[key];
                } else if (['procedureStart', 'procedureEnd'].includes(key)) {
                    form[key] = new Date(hybridSim.value[key]);
                } else if (typeof hybridSim.value[key] === 'string' && hybridSim.value[key]) {
                    form[key] = hybridSim.value[key];
                }
            }

            if (hybridSim.value.facility && typeof hybridSim.value.facility === 'object') {
                form.facility = hybridSim.value.facility
            } else {
                form.facility = {}
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

    configureAuthors(hybridSim, amending) {
        /*  Configure Authors for Hybrid Simulation Editing
            - check and remove authors from hybrid sims that don't exist on the project
            - format project users as authors for hybrid sim metadata
        */
        if (amending) return structuredClone(hybridSim.value.authors);

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
        if (hybridSim) {
            let projectUsers = projectMembers.map((member) => { return member.name });
            let hybridSimUsers = hybridSim.value.authors.map((author) => { return author.name });
            // drop members who are no longer listed in the project...
            // add members who are aren't listed in the hybrid sim...
            let currentAuthors = hybridSim.value.authors.filter((author) => { return projectUsers.includes(author.name) });
            let newAuthors = projectMembers.filter((author) => { return !hybridSimUsers.includes(author.name) });

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
            this.form[fieldName].push({...this.HybridSimDefaults[fieldName][0]});
        }
    }

    dropObjField(fieldName, index) {
        if (this.form[fieldName].length === 1) {
            this.form[fieldName].pop();
            this.form[fieldName].push({...this.HybridSimDefaults[fieldName][0]});
            this.ui.require[fieldName] = false;
        } else if (Number.isInteger(index)) {
            this.form[fieldName].splice(index,1);
        } else {
            this.form[fieldName].pop();
        }
    }

    getEF(str) {
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

    requireField(field) {
        // Sets the field to disabled or enabled during init
        if (field.length > 1) return true;
        return (Object.keys(field[0]).every(input => !field[0][input]) ? false : true );
    }

    prepareData() {
        // drop or reformat inputs before for submission

        const facilityId = this.form.facility.id;
        if (!facilityId) {
            delete this.form.facility;
        } else if (facilityId === 'other') {
            this.form.facility = { id: 'other', name: this.form.facility.label };
        } else {
            this.form.facility = {
                id: facilityId,
                name: this.ui.facilities.find((f) => f.name === facilityId).label,
            };
        }
        if(this.form.simulationType != 'Other') {
            this.form.simulationTypeOther = '';
        }
        this.form.relatedWork = this.validInputs(this.form.relatedWork, ['title', 'href']);
        this.form.referencedData = this.validInputs(this.form.referencedData, ['title', 'doi']);
    }

    createHybridSim() {
        this.prepareData();
        const uuid = this.project.uuid;
        const name = 'designsafe.project.hybrid_simulation';
        this.ProjectEntitiesService.create({
            data: { uuid: uuid, name: name, entity: this.form }
        })
        .then((resp) => {
            this.project.addEntity(resp);
            this.hybridSims = this.project.hybridsimulation_set;
            this.resetForm();
        });
    }

    editHybridSim(hybridSim) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.configureForm(hybridSim);
        this.form.authors = this.configureAuthors(hybridSim, false);
    }

    updateHybridSim() {
        this.prepareData();
        let hybridSim = this.project.getRelatedByUuid(this.uuid);
        const updatedHybridSim = { ...hybridSim, value: this.form };
        this.ProjectEntitiesService.update({
            data: { uuid: this.uuid, entity: updatedHybridSim }
        })
        .then((resp) => {
            hybridSim.update(resp);
            this.resetForm();
        })
        .catch((err) => {
            this.ui.error = true;
        });
    }

    deleteHybridSim(hybridSim) {
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
                        data: { uuid: hybridSim.uuid }
                    })
                    .then((resp) => {
                        this.project.removeEntity(resp);
                        this.hybridSims = this.project.hybridsimulation_set;
                    });
                }
            });
        };
        confirmDelete(`Are you sure you want to delete ${hybridSim.value.title}?`);
    }
}

export const ManageHybridSimComponent = {
    template: ManageHybridSimTemplate,
    controller: ManageHybridSimCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}