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
        var members = [this.options.project.value.pi].concat(this.options.project.value.coPis, this.options.project.value.teamMembers);

        this.data = {
            busy: false,
            experiments: this.options.experiments,
            project: this.options.project,
            users: [... new Set(members)],
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
        exp.value.guests = this.editExpForm.guests;
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