import _ from 'underscore';
import ManageFieldReconReportsTemplate from './manage-field-recon-reports.component.html';

class ManageFieldReconReportsCtrl {
    constructor($q, $uibModal, UserService, ProjectEntitiesService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.UserService = UserService;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        var members = [this.project.value.pi].concat(
            this.project.value.coPis,
            this.project.value.teamMembers,
            this.project.value.
                guestMembers.filter( (g) => g).
                map(
                    (g) => g.user
                )
        );

        members.forEach((m, i) => {
            if (typeof m == 'string') {
                // if user is guest append their data
                if(m.slice(0,5) === 'guest') {
                    let guestData = this.options.project.value.guestMembers.find(
                        (x) => x.user === m
                    );
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

        this.ui = {
            loading: false,
        };

        this.data = {
            busy: false,
            reports: this.project.report_set,
            project: this.project,
            users: [... new Set(members)],
            form: {}
        };

        this.clearForm();
    }

    clearForm() {
        this.form = {
            referencedDatas: [{}],
        };
    }

    configureAuthors(report) {
        // combine project and experiment users then check if any authors need to be built into objects
        let usersToClean = [
            ...new Set([
                ...this.data.users,
                ...report.value.dataCollectors.slice()])
        ];
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
                    if(auth.slice(0,5) === 'guest') {
                        let guestData = this.project.value.guestMembers.find(
                            (x) => x.user === auth
                        );
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
        let rmList = [];
        usersToClean.forEach((m) => {
            let person = this.data.users.find((u) => u.name === m.name);
            if (!person) {
                rmList.push(m);
            }
        });
        rmList.forEach((m) => {
            let index = usersToClean.indexOf(m);
            if (index > -1) {
                usersToClean.splice(index, 1);
            }
        });
        usersToClean.forEach((u, i) => {
            u.order = i;
        });
        return usersToClean;
    }

    addReferenced() {
        let last = this.form.referencedDatas.length - 1;
        if (this.form.referencedDatas[last].title) {
            this.form.referencedDatas.push({});
        }
    }

    saveReport($event) {
        if ($event) {
            $event.preventDefault();
        }
        this.data.busy = true;
        let report = {
            title: this.form.title,
            dataCollectors: this.data.users,
            location: this.form.location,
            longitude: this.form.longitude,
            latitude: this.form.latitude,
            elevation: this.form.elevation,
            referencedDatas: this.form.referencedDatas,
            description: this.form.description,
        };

        this.ProjectEntitiesService.create({
            data: {
                uuid: this.project.uuid,
                name: 'designsafe.project.field_recon.report',
                entity: report,
            }
        }).then( (res) => {
            this.data.project.addEntity(res);
            this.clearForm();
        }, (err) => {
            this.data.error = err;
        }).finally( () => {
            this.data.busy = true;
        });
    }

    editReport(report) {
        this.data.editReport = Object.assign({}, report);
        let auths = this.configureAuthors(report);
        this.form = {
            title: this.data.editReport.value.title,
            dataCollectors: auths,
            referencedDatas: this.data.editReport.value.referencedDatas,
            description: this.data.editReport.value.description,
        };
    }

    updateReport($event){
        $event.preventDefault();
        this.ui.busy = true;
        this.data.editReport.value.title = this.form.title;
        this.data.editReport.value.dataCollectors = this.data.users;
        this.data.editReport.value.referencedDatas = this.form.referencedDatas;
        this.data.editReport.value.description = this.form.description;
        this.ProjectEntitiesService.update({
            data: {
                uuid: this.data.editReport.uuid,
                entity: this.data.editReport,
            }
        }).then( (res) => {
            let report = this.data.project.getRelatedByUuid(res.uuid);
            report.update(res);
            this.data.experiments = this.project.report_set;
            delete this.data.editReport;
            if (window.sessionStorage.experimentData) {
                this.close({ $value: report });
            }
            this.clearForm();
            return res;
        }).finally(()=>{
            this.ui.busy = false;
        });
    }

    deleteReport(report) {
        let confirmDialog = this.$uibModal.open({
            component: 'confirmDelete',
            resolve: {
                options: () => { return { entity: report }; }
            },
            size: 'sm'
        });
        confirmDialog.result.then( (res) => {
            if (!res) {
                return;
            }
            this.ui.busy = true;
            this.ProjectEntitiesService.delete({
                data: {
                    uuid: report.uuid,
                }
            }).then( (entity) => {
                this.project.removeEntity(entity);
                let attrName = this.project.getRelatedAttrName(entity);
                this.data.report = this.project[attrName];
            });
        });
    }

}

export const ManageFieldReconReportsComponent = {
    template: ManageFieldReconReportsTemplate,
    controller: ManageFieldReconReportsCtrl,
    contrlllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
