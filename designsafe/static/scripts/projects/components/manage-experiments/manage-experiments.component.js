import ManageExperimentsTemplate from './manage-experiments.component.html';
import _ from 'underscore';

class ManageExperimentsCtrl {

    constructor($q, $uibModal, Django, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.options = this.resolve.options;
        this.efs = this.resolve.efs;
        this.experimentTypes = this.resolve.experimentTypes;
        this.equipmentTypes = this.resolve.equipmentTypes;
        
        var members = [this.options.project.value.pi].concat(
            this.options.project.value.coPis,
            this.options.project.value.teamMembers,
            this.options.project.value.guestMembers.map(g => g.user)
        );
        members.forEach((m, i) => {
            if (typeof m == 'string') {
                // if user is guest append their data
                if(m.slice(0,5) === 'guest') {
                    var guestData = this.options.project.value.guestMembers.find(x => x.user === m);
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
        };

        this.form = {
            curExperiments: [],
            addExperiments: [{}],
            deleteExperiments: [],
            addGuest: [{}],
            entitiesToAdd: []
        };

        this.form.curExperiments = this.data.project.experiment_set;

        if (this.options.edit) {
            this.editExp(this.options.edit);
        }
    }

    isValid(ent) {
        if (ent && ent != "" && ent != "None") {
            return true;
        }
        return false;
    }

    hasEndDate(date) {
        if (Date.parse(date)) {
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
                        var guestData = this.options.project.value.guestMembers.find(x => x.user === auth);
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

    editExp(experiment) {
        var exp = jQuery.extend(true, {}, experiment);
        var auths = this.configureAuthors(exp);

        exp.value.procedureStart = new Date(exp.value.procedureStart);
        exp.value.procedureEnd = new Date(exp.value.procedureEnd);

        this.editExpForm = {
            exp: exp,
            authors: auths,
            selectedAuthor: '',
            start: exp.value.procedureStart,
            end: exp.value.procedureEnd,
            title: exp.value.title,
            facility: exp.getEF(this.data.project.value.projectType, exp.value.experimentalFacility).label,
            type: exp.value.experimentType,
            equipment: exp.value.equipmentType,
            equipmentOther: exp.value.equipmentTypeOther,
            equipmentList: this.equipmentTypes[exp.value.experimentalFacility],
            description: exp.value.description
        };
        this.ui.showEditExperimentForm = true;
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
        exp.value.equipmentType = this.editExpForm.equipment;
        exp.value.equipmentTypeOther = this.editExpForm.equipmentOther;
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
            if (window.sessionStorage.experimentData) {
                this.close({$value: e});
            }
            return e;
        });
    }

    deleteExperiment(ent) {
        if (this.editExpForm) {
            this.editExpForm = {};
            this.ui.showEditExperimentForm = false;
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
                        this.data.project.removeEntity(entity);
                        this.data.experiments = this.data.project[entityAttr];
                    });
                }
            });
        };
        confirmDelete({'entity': ent});
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
