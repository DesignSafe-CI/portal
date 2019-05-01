import _ from 'underscore';
import ManageFieldReconMissionsTemplate from './manage-field-recon-missions.component.html';

class ManageFieldReconMissionsCtrl {
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
            missions: this.project.mission_set,
            project: this.project,
            users: [... new Set(members)],
            form: {}
        };

        this.form = {};
    }

    cleanForm() {
        this.form = {};
    }

    configureAuthors(mission) {
        // combine project and experiment users then check if any authors need to be built into objects
        let usersToClean = [
            ...new Set([
                ...this.data.users,
                ...mission.value.authors.slice()])
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
        let a;
        let b;
        if (up) {
            if (this.form.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.form.authors.find(
                (x) => {
                    x.order === this.form.selectedAuthor.order - 1;
                }
            );
            b = this.form.authors.find(
                (x) => {
                    x.order === this.form.selectedAuthor.order;
                }
            );
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.form.selectedAuthor.order >=
                this.form.authors.length - 1) {
                return;
            }
            // move down
            a = this.form.authors.find(
                (x) => {
                    x.order === this.form.selectedAuthor.order + 1;
                }
            );
            b = this.form.authors.find(
                (x) => {
                    x.order === this.form.selectedAuthor.order;
                }
            );
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    saveMission($event) {
        if ($event) {
            $event.preventDefault();
        }
        this.data.busy = true;
        this.form.authors = this.data.users;
        let mission = {
            title: this.form.title,
            dateStart: this.form.dateStart,
            dateEnd: this.form.dateEnd,
            location: this.form.location,
            longitude: this.form.longitude,
            latitude: this.form.latitude,
            elevation: this.form.elevation,
            description: this.form.description
        };

        this.ProjectEntitiesService.create({
            data: {
                uuid: this.data.project.uuid,
                name: 'designsafe.project.field_recon.mission',
                entity: mission,
            }
        }).then((res) => {
            this.data.project.addEntity(res);
            this.cleanForm();
        }, (err) => {
            this.data.error = err;
        }).finally( () => {
            this.data.busy = false;
        });
    }

    editMission(mission) {
        this.data.editMission = Object.assign({}, mission);
        this.data.editMission.value.dateStart = new Date(
            this.data.editMission.value.dateStart
        );
        this.data.editMission.value.dateEnd = new Date(
            this.data.editMission.value.dateEnd
        );
        let auths = this.configureAuthors(mission);
        this.form = {
            authors: auths,
            selectedAuthor: '',
            title: this.data.editMission.value.title,
            dateStart: this.data.editMission.value.dateStart,
            dateEnd: this.data.editMission.value.dateEnd,
            location: this.data.editMission.value.location,
            longitude: this.data.editMission.value.longitude,
            latitude: this.data.editMission.value.latitude,
            elevation: this.data.editMission.value.elevation,
            description: this.data.editMission.value.description
        };
    }

    updateMission($event) {
        $event.preventDefault();
        this.ui.busy = true;
        this.data.editMission.value.authors = this.form.authors;
        this.data.editMission.value.title = this.form.title;
        this.data.editMission.value.dateStart = this.form.dateStart;
        this.data.editMission.value.dateEnd = this.form.dateEnd;
        this.data.editMission.value.location = this.form.location;
        this.data.editMission.value.longitude = this.form.longitude;
        this.data.editMission.value.latitude = this.form.latitude;
        this.data.editMission.value.elevation = this.form.elevation;
        this.data.editMission.value.description = this.form.description;
        this.ProjectEntitiesService.update({
            data: {
                uuid: this.data.editMission.uuid,
                entity: this.data.editMission,
            }
        }).then( (res) => {
            let mission = this.data.project.getRelatedByUuid(res.uuid);
            mission.update(res);
            this.data.experiments = this.project.mission_set;
            delete this.data.editMission;
            if (window.sessionStorage.experimentData) {
                this.close({ $value: mission });
            }
            this.cleanForm();
            return res;
        }).finally(()=>{
            this.ui.busy = false;
        });
    }

    deleteMission(mission) {
        let confirmDialog = this.$uibModal.open({
            component: 'confirmDelete',
            resolve: {
                options: () => { return { entity: mission }; }
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
                    uuid: mission.uuid,
                }
            }).then( (entity) => {
                this.project.removeEntity(entity);
                let attrName = this.project.getRelatedAttrName(entity);
                this.data.missions = this.project[attrName];
            });
        });
    }
}

export const ManageFieldReconMissionsComponent = {
    template: ManageFieldReconMissionsTemplate,
    controller: ManageFieldReconMissionsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    }
};
