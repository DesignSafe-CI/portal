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
        members.forEach((m, i) => {
            if (typeof m == 'string') {
                members[i] = { name: m, order: i, authorship: false };
            }
        });

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
        this.close();
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
        /* convert string usernames to author objects and remove duplicates */
        var usersToClean = [...new Set([...this.data.users, ...exp.value.authors.slice()])];
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

        this.editExpForm = {
            exp: exp,
            authors: usersToClean,
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
            if (this.editExpForm.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.editExpForm.authors.find(x => x.order === this.editExpForm.selectedAuthor.order - 1);
            b = this.editExpForm.authors.find(x => x.order === this.editExpForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.editExpForm.selectedAuthor.order >= this.editExpForm.authors.length - 1) {
                return;
            }
            // move down
            a = this.editExpForm.authors.find(x => x.order === this.editExpForm.selectedAuthor.order + 1);
            b = this.editExpForm.authors.find(x => x.order === this.editExpForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
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
        this.form.addExperiments[0].authors = this.data.users;
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