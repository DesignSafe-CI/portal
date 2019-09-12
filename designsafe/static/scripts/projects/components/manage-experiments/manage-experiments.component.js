import ManageExperimentsTemplate from './manage-experiments.component.html';
import experimentalData from "../../../projects/components/manage-experiments/experimental-data.json";
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
        this.project = this.resolve.project;
        this.edit = this.resolve.edit;
        
        this.efs = experimentalData.experimentalFacility;
        this.experimentTypes = experimentalData.experimentTypes;
        this.equipmentTypes = experimentalData.equipmentTypes;

        var members = [this.project.value.pi].concat(
            this.project.value.coPis,
            this.project.value.teamMembers,
            this.project.value.guestMembers.filter((g) => (g && (typeof g === 'object'))).map((g) => g.user)
        );
        members = [...new Set(members)];
        members.forEach((m, i) => {
            if (typeof m == 'string') {
                // if user is guest append their data
                if (m.slice(0, 5) === 'guest') {
                    let guestData = this.project.value.guestMembers.find((x) => x.user === m);
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
            experiments: this.project.experiment_set,
            project: this.project,
            users: [...new Set(members)],
            form: {},
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
            entitiesToAdd: [],
        };

        this.form.curExperiments = this.data.project.experiment_set;

        if (this.edit) {
            this.editExp(this.edit);
        }
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
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
        let efs = this.ui.efs[this.data.project.value.projectType];
        let ef = _.find(efs, function(ef) {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = _.find(ets, (x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = _.find(eqts, (x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    configureAuthors(exp) {
        // combine project and experiment users then check if any authors need to be built into objects
        let usersToClean = [...new Set([...this.data.users, ...exp.value.authors.slice()])];
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
                    if (auth.slice(0, 5) === 'guest') {
                        let guestData = this.project.value.guestMembers.find((x) => x.user === auth);
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
                        usersToClean[i] = { name: auth, order: i, authorship: false };
                    }
                } else {
                    auth.order = i;
                }
            });
        }
        usersToClean = _.uniq(usersToClean, 'name');

        /*
        It is possible that a user added to an experiment may no longer be on a project
        Remove any users on the experiment that are not on the project
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

    editExp(experiment) {
        let exp = jQuery.extend(true, {}, experiment);
        let auths = this.configureAuthors(exp);

        exp.value.procedureStart = new Date(exp.value.procedureStart);
        exp.value.procedureEnd = (exp.value.procedureEnd && exp.value.procedureEnd !== 'None') ? new Date(exp.value.procedureEnd) : '';

        this.editExpForm = {
            exp: exp,
            authors: auths,
            selectedAuthor: '',
            start: exp.value.procedureStart,
            end: exp.value.procedureEnd,
            title: exp.value.title,
            facility: exp.getEF(this.data.project.value.projectType, exp.value.experimentalFacility).label,
            type: this.getET(experiment),
            equipment: exp.value.equipmentType,
            equipmentOther: exp.value.equipmentTypeOther,
            equipmentList: this.equipmentTypes[exp.value.experimentalFacility],
            description: exp.value.description,
        };
        this.ui.showEditExperimentForm = true;
        document.getElementById('form-top').scrollIntoView({ behavior: 'smooth' });
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
        if (!this.editExpForm.selectedAuthor) {
            return;
        }
        let a,
            b;
        if (up) {
            if (this.editExpForm.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.editExpForm.authors.find((x) => x.order === this.editExpForm.selectedAuthor.order - 1);
            b = this.editExpForm.authors.find((x) => x.order === this.editExpForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.editExpForm.selectedAuthor.order >= this.editExpForm.authors.length - 1) {
                return;
            }
            // move down
            a = this.editExpForm.authors.find((x) => x.order === this.editExpForm.selectedAuthor.order + 1);
            b = this.editExpForm.authors.find((x) => x.order === this.editExpForm.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveEditExperiment() {
        let exp = this.editExpForm.exp;
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
                entity: exp,
            },
        }).then((e) => {
            let ent = this.data.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.ui.savingEditExp = false;
            this.data.experiments = this.data.project.experiment_set;
            this.ui.showEditExperimentForm = false;
            if (window.sessionStorage.experimentData) {
                this.close({ $value: e });
            }
            return e;
        });
    }

    deleteExperiment(ent) {
        if (this.editExpForm) {
            this.editExpForm = {};
            this.ui.showEditExperimentForm = false;
        }
        let confirmDelete = (options) => {
            let modalInstance = this.$uibModal.open({
                component: 'confirmDelete',
                resolve: {
                    options: () => options,
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
                        this.data.experiments = this.data.project.experiment_set;
                    });
                }
            });
        };
        confirmDelete({ entity: ent });
    }

    saveExperiment($event) {
        $event.preventDefault();
        this.data.busy = true;
        this.form.addExperiments[0].authors = this.data.users;
        let addActions = this.form.addExperiments.filter((exp) => (exp.title && exp.experimentalFacility && exp.experimentType)).map((exp) => {
            exp.description = exp.description || '';
            return this.ProjectEntitiesService.create({
                data: {
                    uuid: this.data.project.uuid,
                    name: 'designsafe.project.experiment',
                    entity: exp,
                },
            }).then((res) => {
                this.data.project.addEntity(res);
            });
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
        dismiss: '&',
    },
};
