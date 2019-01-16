import ManageSimulationTemplate from './manage-simulations.component.html';
import _ from 'underscore';

class ManageSimulationCtrl {

    constructor($q, Django, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
    }

    $onInit() {
        this.options = this.resolve.options;
        var members = [this.options.project.value.pi].concat(this.options.project.value.coPis, this.options.project.value.teamMembers);
        members.forEach((m, i) => {
            if (typeof m == 'string') {
                members[i] = { name: m, order: i, authorship: false };
            }
        });

        this.data = {
            busy: false,
            simulations: this.options.simulations,
            project: this.options.project,
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
            confirmDel: false,
            idDel: '',
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
                name: 'Geotechnical',
                label: 'Geotechnical'
            },
            {
                name: 'Structural',
                label: 'Structural'
            },
            {
                name: 'Soil Structure System',
                label: 'Soil Structure System'
            },
            {
                name: 'Storm Surge',
                label: 'Storm Surge'
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
                name: 'designsafe.project.simulation',
                entity: simulation
            }
        }).then((res) => {
            this.data.project.addEntity(res);
        }).then(() => {
            this.data.busy = false;
            this.ui.showAddSimulationForm = false;
            this.form.addSimulation = [{}];
        });
    }

    editSim(sim) {
        /* convert string usernames to author objects and remove duplicates */
        var usersToClean = [...new Set([...this.data.users, ...sim.value.authors.slice()])];
        var modAuths = false;
        usersToClean.forEach((a) => {
            if (typeof a == 'string') {
                modAuths = true;
            }
        });
        if (modAuths) {
            usersToClean.forEach((auth, i) => {
                if (typeof auth == 'string') {
                    usersToClean[i] = {name: auth, order: i, authorship: false};
                } else {
                    auth.order = i;
                }
            });
            usersToClean = _.uniq(usersToClean, 'name');
        } else {
            usersToClean = _.uniq(usersToClean, 'name');
        }

        this.editSimForm = {
            sim: sim,
            authors: usersToClean,
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
            this.data.simulations = this.data.project.simulation_set;
            this.ui.showEditSimulationForm = false;
            return e;
        });
    }

    checkDelete(ent) {
        this.ui.confirmDel = true;
        this.ui.idDel = ent;
        if (this.editSimForm) {
            this.editSimForm = {};
            this.ui.showEditSimulationForm = false;
        }
    }

    cancelDelete() {
        this.ui.confirmDel = false;
        this.ui.idDel = '';
    }

    deleteSimulation(ent) {
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
}

ManageSimulationCtrl.$inject = ['$q', 'Django', 'UserService', 'ProjectEntitiesService'];

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