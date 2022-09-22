import ManageHybridSimTemplate from './manage-hybrid-simulations.template.html';
const HybridSimDefaults = require('./hybrid-sim-form-defaults.json');
const HybridSimTypes = require('./hybrid-simulation-types.json');

class ManageHybridSimCtrl {

    constructor($q, $http, $uibModal, UserService) {
        'ngInject';
        this.UserService = UserService;
        this.$http = $http;
        this.$q = $q;
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
            relatedWorkTypes: ["Context", "Linked Project"],
            hybridSimTypes: HybridSimTypes
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
        this.$http.post(
            `/api/projects/${uuid}/meta/${name}/`,
            { entity: this.form }
        ).then((resp) => {
            this.project.addEntity(resp.data);
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
        this.$http.put(
            `/api/projects/meta/${this.uuid}`,
            {entity: updatedHybridSim}
        ).then((resp) => {
            hybridSim.update(resp.data);
            this.resetForm();
        }).catch((err) => {
            this.ui.error = true;
        });
    }

    // BOOKMARK: Fix the template...

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
                    this.$http.delete(`/api/projects/meta/${hybridSim.uuid}`)
                    .then((resp) => {
                        this.project.removeEntity(resp.data);
                        this.hybridSims = this.project.hybridsimulation_set;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + hybridSim.value.title + "?");
    }

    // constructor($q, $uibModal, Django, UserService, ProjectEntitiesService) {
    //     'ngInject';
    //     this.ProjectEntitiesService = ProjectEntitiesService;
    //     this.UserService = UserService;
    //     this.Django = Django;
    //     this.$q = $q;
    //     this.$uibModal = $uibModal;
    // }

    // $onInit() {
    //     this.project = this.resolve.project;
    //     this.edit = this.resolve.edit;

    //     var members = [this.project.value.pi].concat(
    //         this.project.value.coPis,
    //         this.project.value.teamMembers,
    //         this.project.value.guestMembers.map(g => g.user)
    //     );
    //     members.forEach((m, i) => {
    //         if (typeof m == 'string') {
    //             // if user is guest append their data
    //             if(m.slice(0,5) === 'guest') {
    //                 let guestData = this.project.value.guestMembers.find(x => x.user === m);
    //                 members[i] = {
    //                     name: m,
    //                     order: i,
    //                     authorship: false,
    //                     guest: true,
    //                     fname: guestData.fname,
    //                     lname: guestData.lname,
    //                     email: guestData.email,
    //                     inst: guestData.inst,
    //                 };
    //             } else {
    //                 members[i] = { name: m, order: i, authorship: false };
    //             }
    //         }
    //     });

    //     this.data = {
    //         busy: false,
    //         simulations: this.project.hybridsimulation_set,
    //         project: this.project,
    //         users: [... new Set(members)],
    //         form: {}
    //     };
    //     this.ui = {
    //         simulations: {},
    //         updateSimulations: {},
    //         showAddSimReport: {},
    //         showAddSimAnalysis: {},
    //         showAddIntReport: {},
    //         showAddIntAnalysis: {},
    //     };
    //     this.form = {
    //         curSimulation: [],
    //         addSimulation: [{}],
    //         deleteSimulations: [],
    //         addGuest: [{}],
    //         entitiesToAdd: []
    //     };
    //     this.ui.simulationTypes = [
    //         {
    //             name: 'Earthquake',
    //             label: 'Earthquake'
    //         },
    //         {
    //             name: 'Wind',
    //             label: 'Wind'
    //         },
    //         {
    //             name: 'Other',
    //             label: 'Other'
    //         }
    //     ];

    //     if (this.edit) {
    //         this.editSim(this.edit);
    //     }
    // }

    // isValid(ent) {
    //     if (ent && ent != "" && ent != "None") {
    //         return true;
    //     }
    //     return false;
    // }

    // addGuests() {
    //     this.form.addGuest.push({});
    // }

    // cancel() {
    //     this.close();
    // }

    // saveSimulation($event) {
    //     $event.preventDefault();
    //     this.data.busy = true;
    //     this.form.addSimulation[0].authors = this.data.users;
    //     let simulation = this.form.addSimulation[0];
    //     this.ProjectEntitiesService.create({
    //         data: {
    //             uuid: this.data.project.uuid,
    //             name: 'designsafe.project.hybrid_simulation',
    //             entity: simulation
    //         }
    //     }).then((res) => {
    //         this.data.project.addEntity(res);
    //         this.data.simulations = this.data.project.hybridsimulation_set;
    //     }).then(() => {
    //         this.data.busy = false;
    //         this.ui.showAddSimulationForm = false;
    //         this.form.addSimulation = [{}];
    //         this.data.users.forEach((user) => {
    //             user.authorship = false;
    //         });
    //     });
    // }

    // configureAuthors(exp) {
    //     // combine project and experiment users then check if any authors need to be built into objects
    //     let usersToClean = [...new Set([...this.data.users, ...exp.value.authors.slice()])];
    //     let modAuths = false;
    //     let auths = [];

    //     usersToClean.forEach((a) => {
    //         if (typeof a == 'string') {
    //             modAuths = true;
    //         }
    //         if (a.authorship) {
    //             auths.push(a);
    //         }
    //     });
    //     // create author objects for each user
    //     if (modAuths) {
    //         usersToClean.forEach((auth, i) => {
    //             if (typeof auth == 'string') {
    //                 // if user is guest append their data
    //                 if(auth.slice(0,5) === 'guest') {
    //                     let guestData = this.project.value.guestMembers.find(x => x.user === auth);
    //                     usersToClean[i] = {
    //                         name: auth,
    //                         order: i,
    //                         authorship: false,
    //                         guest: true,
    //                         fname: guestData.fname,
    //                         lname: guestData.lname,
    //                         email: guestData.email,
    //                         inst: guestData.inst,
    //                     };
    //                 } else {
    //                     usersToClean[i] = {name: auth, order: i, authorship: false};
    //                 }
    //             } else {
    //                 auth.order = i;
    //             }
    //         });
    //     }
    //     usersToClean = _.uniq(usersToClean, 'name');

    //     /*
    //     It is possible that a user added to an simulation may no longer be on a project
    //     Remove any users on the simulation that are not on the project
    //     */
    //     usersToClean = usersToClean.filter((m) => this.data.users.find((u) => u.name === m.name));

    //     /*
    //     Restore previous authorship status and order if any
    //     */
    //     usersToClean = usersToClean.map((u) => auths.find((a) => u.name == a.name) || u);

    //     /*
    //     Reorder to accomodate blank spots in order and give order to users with no order
    //     */
    //     usersToClean = usersToClean.sort((a, b) => a.order - b.order);
    //     usersToClean.forEach((u, i) => {
    //         u.order = i;
    //     });

    //     return usersToClean;
    // }

    // editSim(simulation) {
    //     document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
    //     let sim = jQuery.extend(true, {}, simulation);
    //     let auths = this.configureAuthors(sim);
    //     this.editSimForm = {
    //         sim: sim,
    //         authors: auths,
    //         description: sim.value.description,
    //         simulationType: sim.value.simulationType,
    //         simulationTypeOther: sim.value.simulationTypeOther,
    //         title: sim.value.title,
    //     };
    //     this.ui.showEditSimulationForm = true;
    // }

    // editAuthors(user, i) {
    //     if (document.getElementById('editAuthor' + i).checked) {
    //         user.authorship = true;
    //     } else {
    //         user.authorship = false;
    //     }
    // }

    // addAuthors(user, i) {
    //     if (document.getElementById('newAuthor' + i).checked) {
    //         user.authorship = true;
    //     } else {
    //         user.authorship = false;
    //     }
    // }

    // orderAuthors(up) {
    //     if (!this.editSimForm.selectedAuthor) {
    //         return;
    //     }
    //     let a,
    //         b;
    //     if (up) {
    //         if (this.editSimForm.selectedAuthor.order <= 0) {
    //             return;
    //         }
    //         // move up
    //         a = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order - 1);
    //         b = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order);
    //         a.order = a.order + b.order;
    //         b.order = a.order - b.order;
    //         a.order = a.order - b.order;
    //     } else {
    //         if (this.editSimForm.selectedAuthor.order >= this.editSimForm.authors.length - 1) {
    //             return;
    //         }
    //         // move down
    //         a = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order + 1);
    //         b = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order);
    //         a.order = a.order + b.order;
    //         b.order = a.order - b.order;
    //         a.order = a.order - b.order;
    //     }
    // }

    // saveEditSimulation() {
    //     let sim = this.editSimForm.sim;
    //     sim.value.title = this.editSimForm.title;
    //     sim.value.description = this.editSimForm.description;
    //     sim.value.authors = this.editSimForm.authors;
    //     sim.value.guests = this.editSimForm.guests;
    //     sim.value.simulationType = this.editSimForm.simulationType;
    //     sim.value.simulationTypeOther = (this.editSimForm.simulationType === 'Other' ?
    //         this.editSimForm.simulationTypeOther : ''
    //     )
    //     this.ui.savingEditSim = true;
    //     this.ProjectEntitiesService.update({
    //         data: {
    //             uuid: sim.uuid,
    //             entity: sim
    //         }
    //     }).then((e) => {
    //         let ent = this.data.project.getRelatedByUuid(e.uuid);
    //         ent.update(e);
    //         this.ui.savingEditSim = false;
    //         this.data.simulations = this.data.project.hybridsimulation_set;
    //         this.ui.showEditSimulationForm = false;
    //         return e;
    //     });
    // }

    // deleteSimulation(ent) {
    //     if (this.editSimForm) {
    //         this.editSimForm = {};
    //         this.ui.showEditSimulationForm = false;
    //     }
    //     let confirmDelete = (msg) => {
    //         let modalInstance = this.$uibModal.open({
    //             component: 'confirmMessage',
    //             resolve: {
    //                 message: () => msg,
    //             },
    //             size: 'sm',
    //         });

    //         modalInstance.result.then((res) => {
    //             if (res) {
    //                 this.ProjectEntitiesService.delete({
    //                     data: {
    //                         uuid: ent.uuid,
    //                     },
    //                 }).then((entity) => {
    //                     this.data.project.removeEntity(entity);
    //                     this.data.simulations = this.data.project.hybridsimulation_set;
    //                 });
    //             }
    //         });
    //     };
    //     confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
    // }
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