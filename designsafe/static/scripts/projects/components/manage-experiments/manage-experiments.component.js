import ManageExperimentsTemplate from './manage-experiments.component.html';
import _ from 'underscore';

class ManageExperimentsCtrl {

    constructor($q, Django, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
    }

    $onInit() {
        this.options = this.resolve.options;

        this.efs = this.resolve.efs;
        this.experimentTypes = this.resolve.experimentTypes;
        this.equipmentTypes = this.resolve.equipmentTypes;

        this.data = {
            busy: false,
            experiments: this.options.experiments,
            project: this.options.project,
            users: [this.options.project.value.pi].concat(this.options.project.value.coPis, this.options.project.value.teamMembers),
            form: {}
        };
        this.ui = {
            experiments: {},
            efs: this.efs,
            experimentTypes: this.experimentTypes,
            equipmentTypes: this.equipmentTypes,
            updateExperiments: {},
            showAddReport: {}
        };
        this.form = {
            curExperiments: [],
            addExperiments: [{}],
            deleteExperiments: [],
            addGuest: [{}],
            entitiesToAdd: []
        };
        this.form.curExperiments = this.data.project.experiment_set;
        this.ui.addingTag = false;
        this.data.form.projectTagToAdd = { optional: {} };
        if (this.data.project.value.projectType === 'experimental') {
            this.ui.tagTypes = [
                {
                    label: 'Model Config',
                    name: 'designsafe.project.model_config',
                    yamzId: 'h1312'
                },
                {
                    label: 'Sensor Info',
                    name: 'designsafe.project.sensor_list',
                    yamzId: 'h1557'
                },
                {
                    label: 'Event',
                    name: 'designsafe.project.event',
                    yamzId: 'h1253'
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.report',
                    yamzId: ''
                }
            ];
        } else if (this.data.project.value.projectType === 'simulation') {
            this.ui.tagTypes = [
                {
                    label: 'Simulation Model',
                    name: 'designsafe.project.simulation.model',
                    yamzId: ''
                },
                {
                    label: 'Simulation Input',
                    name: 'designsafe.project.simulation.input',
                    yamzId: ''
                },
                {
                    label: 'Simulation Output',
                    name: 'designsafe.project.simulation.output',
                    yamzId: ''
                },
                {
                    label: 'Integrated Data Analysis',
                    name: 'designsafe.project.simulation.analysis',
                    yamzId: ''
                },
                {
                    label: 'Integrated Report',
                    name: 'designsafe.project.simulation.report',
                    yamzId: ''
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.report',
                    yamzId: ''
                },
            ];
        } else if (this.data.project.value.projectType === 'hybrid_simulation') {
            this.ui.tagTypes = [
                {
                    label: 'Global Model',
                    name: 'designsafe.project.hybrid_simulation.global_model',
                    yamzId: ''
                },
                {
                    label: 'Coordinator',
                    name: 'designsafe.project.hybrid_simulation.coordinator',
                    yamzId: ''
                },
                {
                    label: 'Simulation Substructure',
                    name: 'designsafe.project.hybrid_simulation.sim_substructure',
                    yamzId: ''
                },
                {
                    label: 'Experimental Substructure',
                    name: 'designsafe.project.hybrid_simulation.exp_substructure',
                    yamzId: ''
                },
                {
                    label: 'Outputs',
                    name: 'designsafe.project.hybrid_simulation.output',
                    yamzId: ''
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.report',
                    yamzId: ''
                }
            ];
        }
        this.ui.simModel = {};
        this.ui.simModel.apps = [
            {
                label: 'ADDCIRC',
                name: 'ADDCIRC',
                yamzId: ''
            },
            {
                label: 'Abaqus',
                name: 'Abaqus',
                yamzId: ''
            },
            {
                label: 'Atena',
                name: 'Atena',
                yamzId: ''
            },
            {
                label: 'ClawPack/GeoClaw',
                name: 'ClawPack/GeoClaw',
                yamzId: ''
            },
            {
                label: 'Diana',
                name: 'Diana',
                yamzId: ''
            },
            {
                label: 'ETABS',
                name: 'ETABS',
                yamzId: ''
            },
            {
                label: 'FUNWAVE',
                name: 'FUNWAVE',
                yamzId: ''
            },
            {
                label: 'FLUENT/ANSYS',
                name: 'FLUENT/ANSYS',
                yamzId: ''
            },
            {
                label: 'LS-Dyna',
                name: 'LS-Dyna',
                yamzId: ''
            },
            {
                label: 'OpenFoam',
                name: 'OpenFoam',
                yamzId: ''
            },
            {
                label: 'OpenSees',
                name: 'OpenSees',
                yamzId: ''
            },
            {
                label: 'PERFORM',
                name: 'PERFORM',
                yamzId: ''
            },
            {
                label: 'SAP',
                name: 'SAP',
                yamzId: ''
            },
            {
                label: 'SWAN',
                name: 'SWAN',
                yamzId: ''
            },
            {
                label: 'Other',
                name: 'Other',
                yamzId: ''
            },
        ];
        this.ui.simModel.NHType = [
            {
                label: 'Earthquake',
                name: 'Earthquake',
                yamzId: ''
            },
            {
                label: 'Flood',
                name: 'Flood',
                yamzId: ''
            },
            {
                label: 'Landslide',
                name: 'Landslide',
                yamzId: ''
            },
            {
                label: 'Tornado',
                name: 'Tornado',
                yamzId: ''
            },
            {
                label: 'Tsunami',
                name: 'Tsunami',
                yamzId: ''
            },
            {
                label: 'Other',
                name: 'Other',
                yamzId: ''
            },
        ];
    }

    addExperiment() {
        this.form.addExperiments.push({});
    }

    addGuests() {
        this.form.addGuest.push({});
    }

    cancel() {
        this.dismiss();
    }

    getEF(str) {
        var efs = this.ui.efs[this.data.project.value.projectType];
        var ef = _.find(efs, function (ef) {
            return ef.name === str;
        });
        return ef;
    }

    getET(type, str) {
        var ets = this.ui.experimentTypes[type];
        var et = _.find(ets, function (et) {
            return et.name === str;
        });
        return et;
    }

    editExp(exp) {
        this.editExpForm = {
            exp: exp,
            authors: exp.value.authors.slice(),
            start: exp.value.procedureStart,
            end: exp.value.procedureEnd,
            title: exp.value.title,
            facility: exp.getEF(this.data.project.value.projectType, exp.value.experimentalFacility).label,
            type: exp.value.experimentType,
            equipment: exp.getET(exp.value.experimentalFacility, exp.value.equipmentType).label,
            description: exp.value.description
        };
        this.ui.showEditExperimentForm = true;
    }

    editAuthors(user) {
        var index = this.editExpForm.authors.indexOf(user);
        if (index > -1) {
            this.editExpForm.authors.splice(index, 1);
        } else {
            this.editExpForm.authors.push(user);
        }
    }

    /*
    addAuthors will need to be updated if option to support
    simultaneous experiment creation is implemented
    */
    addAuthors(user) {
        if (this.form.addExperiments[0].authors) {
            var index = this.form.addExperiments[0].authors.indexOf(user);
            if (index > -1) {
                this.form.addExperiments[0].authors.splice(index, 1);
            } else {
                this.form.addExperiments[0].authors.push(user);
            }
        } else {
            this.form.addExperiments[0].authors = [user];
        }
    }

    saveEditExperiment() {
        var exp = this.editExpForm.exp;
        exp.value.title = this.editExpForm.title;
        exp.value.description = this.editExpForm.description;
        exp.value.procedureStart = this.editExpForm.start;
        exp.value.procedureEnd = this.editExpForm.end;
        exp.value.authors = this.editExpForm.authors;
        exp.value.guests = this.editExpForm.guests; // save guests??
        this.ui.savingEditExp = true;
        this.ProjectEntitiesService.update({
            data: {
                uuid: exp.uuid,
                entity: exp
            }
        }).then((e) => {
            var ent = this.data.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.ui.savingEditExp = false;
            this.data.experiments = this.data.project.experiment_set;
            this.ui.showEditExperimentForm = false;
            return e;
        });
    }

    toggleDeleteExperiment(uuid) {
        if (uuid in this.ui.experiments &&
            this.ui.experiments[uuid].deleted) {
            var index = this.form.deleteExperiments.indexOf(uuid);
            this.form.deleteExperiments.splice(index, 1);
            this.ui.experiments[uuid].deleted = false;
        } else {
            this.form.deleteExperiments.push(uuid);
            this.ui.experiments[uuid] = {};
            this.ui.experiments[uuid].deleted = true;
        }
    }

    saveExperiment($event) {
        $event.preventDefault();
        this.data.busy = true;
        var addActions = _.map(this.form.addExperiments, (exp) => {
            exp.description = exp.description || '';
            if (exp.title && exp.experimentalFacility && exp.experimentType) {
                return this.ProjectEntitiesService.create({
                    data: {
                        uuid: this.data.project.uuid,
                        name: 'designsafe.project.experiment',
                        entity: exp
                    }
                }).then((res) => {
                    this.data.project.addEntity(res);
                });
            }
        });

        this.$q.all(addActions).then(
            (results) => {
                this.data.busy = false;
                this.form.addExperiments = [{}];
            },
            (error) => {
                this.data.error = error;
            }
        );
    }

    removeExperiments() {
        this.data.busy = true;
        var removeActions = _.map(this.form.deleteExperiments, (uuid) => {
            return this.ProjectEntitiesService.delete({
                data: {
                    uuid: uuid,
                }
            }).then((entity) => {
                var entityAttr = this.data.project.getRelatedAttrName(entity.name);
                var entitiesArray = this.data.project[entityAttr];
                entitiesArray = _.filter(entitiesArray, (e) => {
                    return e.uuid !== entity.uuid;
                });
                this.data.project[entityAttr] = entitiesArray;
                this.data.experiments = this.data.project[entityAttr];
            });
        });

        this.$q.all(removeActions).then(
            (results) => {
                this.data.busy = false;
                this.form.addExperiments = [{}];
            },
            (error) => {
                this.data.busy = false;
                this.data.error = error;
            }
        );

    }
}

ManageExperimentsCtrl.$inject = ['$q', 'Django', 'UserService', 'ProjectEntitiesService'];

export const ManageExperimentsComponent = {
    template: ManageExperimentsTemplate,
    controller: ManageExperimentsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}