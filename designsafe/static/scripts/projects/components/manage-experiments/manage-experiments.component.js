import _ from 'underscore';
import ManageExperimentsTemplate from './manage-experiments.template.html';
import experimentalData from './experimental-data.json';

class ManageExperimentsCtrl {

    constructor($q, $uibModal, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.UserService = UserService;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    // TODO: When we Edit an experiment, we're not pulling in new guest users from the project...
    $onInit() {
        this.ui = {
            loading: true,
            error: '',
        };
        this.project = this.resolve.project;
        this.edit = this.resolve.edit;
        var members = [this.project.value.pi].concat(
            this.project.value.coPis,
            this.project.value.teamMembers,
            this.project.value.guestMembers
                .filter((g) => (g && (typeof g === 'object')))
                .map((g) => g.user)
        );

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
            experiments: this.project.experiment_set,
            project: this.project,
            users: [...new Set(members)],
            experimentalFacilities: experimentalData.experimentalFacility.experimental,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            form: {},
        };

        this.cleanForm();
        if (this.edit) {
            this.editExperiment(this.edit);
        }
        this.ui.loading = false;
    }

    cleanForm() {
        this.form = {'authors' : angular.copy(this.data.users)};
    }

    configureAuthors(exp) {
        // combine project and experiment users then check if any authors need to be built into objects
        let usersToClean = [
            ...new Set([
                ...this.data.users,
                ...exp.value.authors.slice()])
        ];
        let orders = usersToClean.map(({order}) => {return order});
        let reorder = orders.length > [...new Set(orders)].length;
        let auths = [];

        usersToClean.forEach((a) => {
            if (typeof a == 'string') {
                reorder = true;
            }
            if (a.authorship) {
                auths.push(a);
            }
        });
        // create author objects for each user
        if (reorder) {
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
                        usersToClean[i] = {
                            name: auth,
                            order: i,
                            authorship: false
                        };
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

    editAuthors(user, i) {
        if (document.getElementById('editAuthor' + i).checked) {
            user.authorship = true;
        } else {
            user.authorship = false;
        }
    }

    validAuthors(){
        for(let i = 0; i < this.form.authors.length; i++) {
            if (this.form.authors[i].authorship === true) {
                return false;
            }
        }
        return true;
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    getEF(str) {
        let efs = this.data.experimentalFacilities;
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.data.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.data.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    saveExperiment($event) {
        if ($event) {
            $event.preventDefault();
        }
        this.ui.loading = true;
        let experiment = {
            title: this.form.title,
            experimentalFacility: this.form.experimentalFacility,
            experimentalFacilityOther: this.form.experimentalFacilityOther || '',
            experimentType: this.form.experimentType,
            experimentTypeOther: this.form.experimentTypeOther || '',
            equipmentType: this.form.equipmentType,
            equipmentTypeOther: this.form.equipmentTypeOther || '',
            procedureStart: this.form.procedureStart,
            procedureEnd: this.form.procedureEnd,
            authors: this.form.authors,
            description: this.form.description
        };

        if (isNaN(Date.parse(experiment.procedureEnd))) {
            experiment.procedureEnd = new Date(experiment.procedureStart);
        }

        this.ProjectEntitiesService.create({
            data: {
                uuid: this.data.project.uuid,
                name: 'designsafe.project.experiment',
                entity: experiment,
            }
        }).then((res) => {
            this.data.project.addEntity(res);
            this.data.experiments = this.project.experiment_set;
            this.cleanForm();
        }, (err) => {
            this.ui.error = err;
        }).finally( () => {
            this.ui.loading = false;
        });
    }

    editExperiment(experiment) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.data.editExperiment = Object.assign({}, experiment);
        if (this.data.editExperiment.value.procedureEnd &&
            this.data.editExperiment.value.procedureEnd !== this.data.editExperiment.value.procedureStart) {
                this.data.editExperiment.value.procedureEnd = new Date(this.data.editExperiment.value.procedureEnd);
        } else {
            this.data.editExperiment.value.procedureEnd = '';
        }
        this.data.editExperiment.value.procedureStart = new Date(
            this.data.editExperiment.value.procedureStart
        );
        let auths = this.configureAuthors(experiment);
        this.form = {
            title: this.data.editExperiment.value.title,
            authors: auths,
            experimentalFacility: this.data.editExperiment.value.experimentalFacility,
            experimentalFacilityOther: this.data.editExperiment.value.experimentalFacilityOther || '',
            experimentType: this.data.editExperiment.value.experimentType,
            experimentTypeOther: this.data.editExperiment.value.experimentTypeOther || '',
            equipmentType: this.data.editExperiment.value.equipmentType,
            equipmentTypeOther: this.data.editExperiment.value.equipmentTypeOther || '',
            procedureStart: this.data.editExperiment.value.procedureStart,
            procedureEnd: this.data.editExperiment.value.procedureEnd,
            authors: this.data.editExperiment.value.authors,
            description: this.data.editExperiment.value.description
        };
    }

    updateExperiment($event) {
        $event.preventDefault();
        this.ui.loading = true;
        this.data.editExperiment.value.authors = this.form.authors;
        this.data.editExperiment.value.title = this.form.title;
        this.data.editExperiment.value.procedureStart = this.form.procedureStart;
        this.data.editExperiment.value.procedureEnd = this.form.procedureEnd;
        this.data.editExperiment.value.description = this.form.description;
        this.data.editExperiment.value.experimentalFacility = this.form.experimentalFacility;
        this.data.editExperiment.value.experimentalFacilityOther = this.form.experimentalFacilityOther;
        this.data.editExperiment.value.experimentType = this.form.experimentType;
        this.data.editExperiment.value.experimentTypeOther = this.form.experimentTypeOther;
        this.data.editExperiment.value.equipmentType = this.form.equipmentType;
        this.data.editExperiment.value.equipmentTypeOther = this.form.equipmentTypeOther;

        if (isNaN(Date.parse(this.data.editExperiment.value.procedureEnd))) {
            this.data.editExperiment.value.procedureEnd = new Date(this.data.editExperiment.value.procedureStart);
        }

        this.ProjectEntitiesService.update({
            data: {
                uuid: this.data.editExperiment.uuid,
                entity: this.data.editExperiment,
            }
        }).then( (res) => {
            let experiment = this.data.project.getRelatedByUuid(res.uuid);
            experiment.update(res);
            this.data.experiments = this.project.experiment_set;
            delete this.data.editExperiment;
            if (window.sessionStorage.experimentData) {
                this.close({ $value: experiment });
            }
            this.cleanForm();
            return res;
        }).finally(()=>{
            this.ui.loading = false;
        });
    }

    deleteExperiment(ent) {
        let confirmDelete = (msg) => {
            let modalInstance = this.$uibModal.open({
                component: 'confirmMessage',
                resolve: {
                    message: () => msg,
                },
                size: 'sm'
            });

            modalInstance.result.then((res) => {
                if (res) {
                    this.ProjectEntitiesService.delete({
                        data: {
                            uuid: ent.uuid
                        }
                    }).then((entity) => {
                        this.project.removeEntity(entity);
                        this.data.experiments = this.project.experiment_set;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
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
