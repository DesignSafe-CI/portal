import ManageHybridSimTemplate from './manage-hybrid-simulations.component.html';
import _ from 'underscore';

class ManageHybridSimCtrl {

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

        this.data = {
            busy: false,
            simulations: this.options.hybridSimulations,
            project: this.options.project,
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
        this.dismiss();
    }

    saveSimulation($event) {
        $event.preventDefault();
        this.data.busy = true;
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
        }).then(() => {
            this.data.busy = false;
            this.ui.showAddSimulationForm = false;
            this.form.addSimulation = [{}];
        });
    }

    editSim(sim) {
        this.editSimForm = {
            sim: sim,
            authors: sim.value.authors.slice(),
            description: sim.value.description,
            simulationType: sim.value.simulationType,
            simulationTypeOther: sim.value.simulationTypeOther,
            title: sim.value.title,
        };
        this.ui.showEditSimulationForm = true;
    }

    editAuthors(user) {
        var index = this.editSimForm.authors.indexOf(user);
        if (index > -1) {
            this.editSimForm.authors.splice(index, 1);
        } else {
            this.editSimForm.authors.push(user);
        }
    }

    /*
    addAuthors will need to be updated if option to support
    simultaneous hybrid simulation creation is implemented
    */
    addAuthors(user) {
        if (this.form.addSimulation[0].authors) {
            var index = this.form.addSimulation[0].authors.indexOf(user);
            if (index > -1) {
                this.form.addSimulation[0].authors.splice(index, 1);
            } else {
                this.form.addSimulation[0].authors.push(user);
            }
        } else {
            this.form.addSimulation[0].authors = [user];
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

ManageHybridSimCtrl.$inject = ['$q', 'Django', 'UserService', 'ProjectEntitiesService'];

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