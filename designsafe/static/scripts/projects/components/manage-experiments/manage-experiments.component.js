import ManageExperimentsTemplate from './manage-experiments.component.html';
import _ from 'underscore';

class ManageExperimentsCtrl {

    constructor($q, Django, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
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
            showAddReport: {},
            confirmDel: false,
            idDel: '',
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

    isValid(ent) {
        if (ent && ent != "" && ent != "None") {
            return true;
        }
        return false;
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
            authorOrder: [],
            selectedAuthor: '',
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

    // may need to create unique ordering object for users
    orderAuthors(up) {
        var oldIndex = this.editExpForm.authors.indexOf(this.editExpForm.selectedAuthor);
        var newIndex;
        if (up === true) {
            newIndex = oldIndex - 1;
        } else {
            newIndex = oldIndex + 1;
        }

        if (newIndex < 0) {
            return;
        } else if (newIndex > this.editExpForm.authors.length) {
            return;
        }
        this.editExpForm.authors.splice(newIndex, 0, this.editExpForm.authors.splice(oldIndex, 1)[0]);
    }

    saveEditExperiment() {
        var exp = this.editExpForm.exp;
        exp.value.title = this.editExpForm.title;
        exp.value.description = this.editExpForm.description;
        exp.value.procedureStart = this.editExpForm.start;
        exp.value.procedureEnd = this.editExpForm.end;
        exp.value.authors = this.editExpForm.authors;
        exp.value.guests = this.editExpForm.guests;
        exp.value.authorOrder = this.editExpForm.authorOrder;
        this.editExpForm.authors.forEach((a) => {
            var author = {};
            author.name = a;
            author.order = this.editExpForm.authors.indexOf(a);
            exp.value.authorOrder.push(author);
        });

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

    checkDelete(ent) {
        this.ui.confirmDel = true;
        this.ui.idDel = ent;
        if (this.editExpForm) {
            this.editExpForm = {};
            this.ui.showEditExperimentForm = false;
        }
    }

    cancelDelete() {
        this.ui.confirmDel = false;
        this.ui.idDel = '';
    }

    deleteExperiment(ent) {
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
            this.data.experiments = this.data.project[entityAttr];
        });
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