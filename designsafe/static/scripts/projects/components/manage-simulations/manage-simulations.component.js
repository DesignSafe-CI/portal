import ManageSimulationTemplate from './manage-simulations.component.html';
const simulationTypes = require('./simulation-types.json');
import _ from 'underscore';

class ManageSimulationCtrl {

    constructor($q, $uibModal, Django, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.edit = this.resolve.edit;

        var members = [this.project.value.pi].concat(
            this.project.value.coPis,
            this.project.value.teamMembers,
            this.project.value.guestMembers.map(g => g.user)
        );
        members.forEach((m, i) => {
            if (typeof m == 'string') {
                // if user is guest append their data
                if(m.slice(0,5) === 'guest') {
                    let guestData = this.project.value.guestMembers.find(x => x.user === m);
                    members[i] = {
                        name: m,
                        order: i,
                        authorship: false,
                        guest: true,
                        fname: guestData.fname,
                        lname: guestData.lname,
                        email: guestData.email,
                        inst: guestData.inst,
                    };
                } else {
                    members[i] = { name: m, order: i, authorship: false };
                }
            }
        });

        this.data = {
            busy: false,
            simulations: this.project.simulation_set,
            project: this.project,
            users: [... new Set(members)],
            form: {},
        };
        this.ui = {
            simulations: {},
            updateSimulations: {},
            showAddSimReport: {},
            showAddSimAnalysis: {},
            showAddIntReport: {},
            showAddIntAnalysis: {},
        };
        this.form = {
            curSimulation: [],
            addSimulation: [{}],
            deleteSimulations: [],
            addGuest: [{}],
            entitiesToAdd: []
        };
        this.ui.simulationTypes = simulationTypes.simulationTypes;

        if (this.edit) {
            this.editSim(this.edit);
        }
    }

    isValid(ent) {
        if (ent && ent != "" && ent != "None") {
            return true;
        }
        return false;
    }
    

    addGuests() {
        this.form.addGuest.push({});
    }

    cancel() {
        this.close();
    }

    saveSimulation($event) {
        $event.preventDefault();
        this.data.busy = true;
        this.form.addSimulation[0].authors = this.data.users;
        let simulation = this.form.addSimulation[0];
        this.ProjectEntitiesService.create({
            data: {
                uuid: this.data.project.uuid,
                name: 'designsafe.project.simulation',
                entity: simulation
            }
        }).then((res) => {
            this.data.project.addEntity(res);
            this.data.simulations = this.data.project.simulation_set;
        }).then(() => {
            this.data.busy = false;
            this.ui.showAddSimulationForm = false;
            this.form.addSimulation = [{}];
            this.data.users.forEach((user) => {
                user.authorship = false;
            });
        });
    }

    configureAuthors(sim) {
        // combine project and simulation users then check if any authors need to be built into objects
        let usersToClean = [...new Set([...this.data.users, ...sim.value.authors.slice()])];
        let modAuths = false;
        let auths = [];

        usersToClean.forEach((a) => {
            if (typeof a == 'string') {
                modAuths = true;
            }
            if (a.authorship) {
                auths.push(a);
            }
        });
        // create author objects for each user
        if (modAuths) {
            usersToClean.forEach((auth, i) => {
                if (typeof auth == 'string') {
                    // if user is guest append their data
                    if(auth.slice(0,5) === 'guest') {
                        let guestData = this.project.value.guestMembers.find(x => x.user === auth);
                        usersToClean[i] = {
                            name: auth,
                            order: i,
                            authorship: false,
                            guest: true,
                            fname: guestData.fname,
                            lname: guestData.lname,
                            email: guestData.email,
                            inst: guestData.inst,
                        };
                    } else {
                        usersToClean[i] = {name: auth, order: i, authorship: false};
                    }
                } else {
                    auth.order = i;
                }
            });
        }
        usersToClean = _.uniq(usersToClean, 'name');

        /*
        It is possible that a user added to a simulation may no longer be on a project
        Remove any users on the simulation that are not on the project
        */
        usersToClean = usersToClean.filter((m) => this.data.users.find((u) => u.name === m.name));

        /*
        Restore previous authorship status and order if any
        */
        usersToClean = usersToClean.map((u) => auths.find((a) => u.name == a.name) || u);

        /*
        Reorder to accomodate blank spots in order and give order to users with no order
        */
        usersToClean = usersToClean.sort((a, b) => a.order - b.order);
        usersToClean.forEach((u, i) => {
            u.order = i;
        });

        return usersToClean;
    }

    editSim(simulation) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        let sim = jQuery.extend(true, {}, simulation);
        let auths = this.configureAuthors(sim);
        this.editSimForm = {
            sim: sim,
            authors: auths,
            selectedAuthor: '',
            description: sim.value.description,
            simulationType: sim.value.simulationType,
            simulationTypeOther: sim.value.simulationTypeOther,
            title: sim.value.title,
        };
        this.ui.showEditSimulationForm = true;
    }

    editAuthors(user, i) {
        if (document.getElementById('editAuthor' + i).checked) {
            user.authorship = true;
        } else {
            user.authorship = false;
        }
    }

    addAuthors(user, i) {
        if (document.getElementById('newAuthor' + i).checked) {
            user.authorship = true;
        } else {
            user.authorship = false;
        }
    }

    orderAuthors(up) {
        if (!this.editSimForm.selectedAuthor) {
            return;
        }
        let a,
            b;
        if (up) {
            if (this.editSimForm.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order - 1);
            b = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.editSimForm.selectedAuthor.order >= this.editSimForm.authors.length - 1) {
                return;
            }
            // move down
            a = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order + 1);
            b = this.editSimForm.authors.find(x => x.order === this.editSimForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveEditSimulation() {
        let sim = this.editSimForm.sim;
        sim.value.title = this.editSimForm.title;
        sim.value.description = this.editSimForm.description;
        sim.value.authors = this.editSimForm.authors;
        sim.value.guests = this.editSimForm.guests;
        sim.value.simulationType = this.editSimForm.simulationType;
        sim.value.simulationTypeOther = (this.editSimForm.simulationType === 'Other' ?
            this.editSimForm.simulationTypeOther : ''
        )
        this.ui.savingEditSim = true;
        this.ProjectEntitiesService.update({
            data: {
                uuid: sim.uuid,
                entity: sim
            }
        }).then((e) => {
            let ent = this.data.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.ui.savingEditSim = false;
            this.data.simulations = this.data.project.simulation_set;
            this.ui.showEditSimulationForm = false;
            return e;
        });
    }

    deleteSimulation(ent) {
        if (this.editSimForm) {
            this.editSimForm = {};
            this.ui.showEditSimulationForm = false;
        }
        let confirmDelete = (msg) => {
            let modalInstance = this.$uibModal.open({
                component: 'confirmMessage',
                resolve: {
                    message: () => msg,
                },
                size: 'sm',
            });

            modalInstance.result.then((res) => {
                if (res) {
                    this.ProjectEntitiesService.delete({
                        data: {
                            uuid: ent.uuid,
                        },
                    }).then((entity) => {
                        this.data.project.removeEntity(entity);
                        this.data.simulations = this.data.project.simulation_set;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
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