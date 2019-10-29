import ManageHybridSimTemplate from './manage-hybrid-simulations.component.html';
import _ from 'underscore';

class ManageHybridSimCtrl {

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
                    var guestData = this.project.value.guestMembers.find(x => x.user === m);
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
            simulations: this.project.hybridsimulation_set,
            project: this.project,
            users: [... new Set(members)],
            form: {}
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
        this.ui.simulationTypes = [
            {
                name: 'Earthquake',
                label: 'Earthquake'
            },
            {
                name: 'Wind',
                label: 'Wind'
            },
            {
                name: 'Other',
                label: 'Other'
            }
        ];

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
        var simulation = this.form.addSimulation[0];
        if (_.isEmpty(simulation.title) || typeof simulation.title === 'undefined' ||
            _.isEmpty(simulation.simulationType) || typeof simulation.simulationType === 'undefined') {
            this.data.error = 'Title and Type are required.';
            this.data.busy = false;
            return;
        }
        simulation.description = simulation.description || '';
        this.ProjectEntitiesService.create({
            data: {
                uuid: this.data.project.uuid,
                name: 'designsafe.project.hybrid_simulation',
                entity: simulation
            }
        }).then((res) => {
            this.data.project.addEntity(res);
            this.data.simulations = this.data.project.hybridsimulation_set;
        }).then(() => {
            this.data.busy = false;
            this.ui.showAddSimulationForm = false;
            this.form.addSimulation = [{}];
        });
    }

    configureAuthors(exp) {
        // combine project and experiment users then check if any authors need to be built into objects
        var usersToClean = [...new Set([...this.data.users, ...exp.value.authors.slice()])];
        var modAuths = false;
        var auths = [];

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
                        var guestData = this.project.value.guestMembers.find(x => x.user === auth);
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
            usersToClean = _.uniq(usersToClean, 'name');
        } else {
            usersToClean = _.uniq(usersToClean, 'name');
        }
        /*
        Restore previous authorship status if any
        */
        if (auths.length) {
            auths.forEach((a) => {
                usersToClean.forEach((u, i) => {
                    if (a.name === u.name) {
                        usersToClean[i] = a;
                    }
                });
            });
        }
        /*
        It is possible that a user added to an experiment may no longer be on a project
        Remove any users on the experiment that are not on the project
        */
        var rmList = [];
        usersToClean.forEach((m) => {
          var person = this.data.users.find(u => u.name === m.name);
          if (!person) {
            rmList.push(m);
          }
        });
        rmList.forEach((m) => {
          var index = usersToClean.indexOf(m);
          if (index > -1) {
            usersToClean.splice(index, 1);
          }
        });
        usersToClean.forEach((u, i) => {
            u.order = i;
        });
        return usersToClean;
    }

    editSim(simulation) {
        var sim = jQuery.extend(true, {}, simulation);
        var auths = this.configureAuthors(sim);
        this.editSimForm = {
            sim: sim,
            authors: auths,
            description: sim.value.description,
            simulationType: sim.value.simulationType,
            simulationTypeOther: sim.value.simulationTypeOther,
            title: sim.value.title,
        };
        this.ui.showEditSimulationForm = true;
        document.getElementById("form-top").scrollIntoView({behavior: "smooth"});
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
        var a;
        var b;
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
        var sim = this.editSimForm.sim;
        sim.value.title = this.editSimForm.title;
        sim.value.description = this.editSimForm.description;
        sim.value.authors = this.editSimForm.authors;
        sim.value.guests = this.editSimForm.guests;
        this.ui.savingEditSim = true;
        this.ProjectEntitiesService.update({
            data: {
                uuid: sim.uuid,
                entity: sim
            }
        }).then((e) => {
            var ent = this.data.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.ui.savingEditSim = false;
            this.data.simulations = this.data.project.hybridsimulation_set;
            this.ui.showEditSimulationForm = false;
            return e;
        });
    }

    deleteSimulation(ent) {
        if (this.editSimForm) {
            this.editSimForm = {};
            this.ui.showEditSimulationForm = false;
        }
        var confirmDelete = (options) => {
            var modalInstance = this.$uibModal.open({
                component: 'confirmDelete',
                resolve: {
                    options: () => options,
                },
                size: 'sm'
            });

            modalInstance.result.then((res) => {
                if (res) {
                    this.ProjectEntitiesService.delete({
                        data: {
                            uuid: ent.uuid,
                        }
                    }).then((entity) => {
                        var entityAttr = this.data.project.getRelatedAttrName(entity.name);
                        var entitiesArray = this.data.project[entityAttr];
                        entitiesArray = _.filter(entitiesArray, (e) => {
                            return e.uuid !== entity.uuid;
                        });
                        this.data.project[entityAttr] = entitiesArray;
                        this.data.simulations = this.data.project[entityAttr];
                    });
                }
            });
        };
        confirmDelete({'entity': ent});
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