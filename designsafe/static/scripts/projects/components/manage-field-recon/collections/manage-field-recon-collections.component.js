import _ from 'underscore';
import ManageFieldReconCollectionsTemplate from './manage-field-recon-collections.component.html';

class ManageFieldReconCollectionsCtrl {
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
                    var guestData = this.project.value.guestMembers.find(
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
            collections: this.project.collection_set,
            project: this.project,
            users: [... new Set(members)],
            observationTypes: [
                'Wind',
                'Structural',
                'Storm Surge / Coastal',
                'Social Science',
                'Geotechnical',
                'Field Sensors',
                'Coastal',
                'Other',
            ],
            instruments: { 
                General: [
                    'Other',
                    'None',
                    'Long Range Laser Scanner',
                    'Close Range Lase Scanner',
                    'UAV Mounted Laser Scanner',
                    'GPS',
                    'Total Station',
                    'Digital Level',
                    'Street View Camera',
                    'Thermal Camera',
                    'DSLR Camera',
                    'Gigapan',
                    '360 Degree Camera',
                    'UAVs with Lidar',
                    'UAVs Industrial Grade',
                    'UAVs Medium Grade',
                    'UAVs Lightweight Grade',
                    'Handheld CPT',
                    'Schmidt Hammer',
                    'Soil Sampling Kit',
                    'Z-boat',
                    'Acoustic Beacons'
                ],
                Sensors: [
                    'Seismometers',
                    'Geophones',
                    'Water Level Gauges',
                    'Accelerometer',
                    'Comopnent Velocity & Statistic Pressure Probes',
                    'Inertial',
                    'Particle Image Velocimetry',
                    'Pilot Tube',
                    'Pressure Scanner',
                    'Laser',
                    'Linear Variable Differential Transformer',
                    'Load Cells',
                    'String Potentiometer',
                    'Strain Gauge',
                    'Pocket Penetrometer'
                ],
                'Social Science': [
                    'EGG Headset',
                    'Interview Equipment'
                ]
            },
        };
        this.clearForm();
    }

    clearForm() {
        this.form = {
            observationTypes: [null],
            observationTypeOthers: [null],
            instruments: [{}],
            instrumentTypeOthers: [null],
            referencedDatas: [{}],
            dataCollectors: angular.copy(this.data.users),
        };
    }

    isObservationInDropdown($index) {
        return this.data.observationTypes.includes(
            this.form.observationTypes[$index]
        );
    }

    showObservationDropdown($index) {
        return (this.isObservationInDropdown($index) ||
                !this.form.observationTypes[$index]);
    }

    showObservationInput($index) {
        return (this.form.observationTypes[$index] === 'Other' ||
                (!this.isObservationInDropdown($index) &&
                 this.form.observationTypes[$index]));
    }

    addObservationType() {
        let last = this.form.observationTypes.length - 1;
        if (this.form.observationTypes[last]) {
            this.form.observationTypes.push(null);
            this.form.observationTypeOthers.push(null);
        }
    }

    isInstrumentInDropdown($index) {
        for ( let group in this.data.instruments ){
            let selections = this.data.instruments[group];
            if (selections.includes(this.form.instruments[$index].name)) {
                return true;
            }
        }
        return false;
    }

    validCollector(){
        for(var i = 0; i < this.form.dataCollectors.length; i++) {
            if (this.form.dataCollectors[i].authorship === true) {
                return false;
            }
        }
        return true;
    }

    showInstrumentDropdown($index) {
        let instrument = this.form.instruments[$index];
        return (this.isInstrumentInDropdown($index) ||
                (!instrument.name));
    }

    showInstrumentInput($index) {
        let instrument = this.form.instruments[$index];
        return (instrument.name === 'Other' ||
                (!this.isInstrumentInDropdown($index) &&
                 instrument.name));
    }

    addInstrument() {
        let last = this.form.instruments.length - 1;
        if (this.form.instruments[last].name) {
            this.form.instruments.push({});
            this.form.instrumentTypeOthers.push(null);
        }
    }

    addReferenced() {
        let last = this.form.referencedDatas.length - 1;
        if (this.form.referencedDatas[last].title) {
            this.form.referencedDatas.push({});
        }
    }

    configureAuthors(collection) {
        // combine project and experiment users then check if any authors need to be built into objects
        let usersToClean = [
            ...new Set([
                ...this.data.users,
                ...collection.value.dataCollectors.slice()])
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

    saveCollection($event) {
        if ($event) {
            $event.preventDefault();
        }
        this.data.busy = true;
        let collection = {
            title: this.form.title,
            observationTypes: this.form.observationTypes
                .map((type, index) => {
                    if(type === 'Other') {
                        return this.form.observationTypeOthers[index];
                    }
                    return type;
                })
                .filter(input => input),
            dateStart: this.form.dateStart,
            dateEnd: this.form.dateEnd,
            dataCollectors: this.form.dataCollectors,
            location: this.form.location,
            longitude: this.form.longitude,
            latitude: this.form.latitude,
            elevation: this.form.elevation,
            instruments: this.form.instruments
                .map((type, index) => {
                    if(type.name === 'Other') {
                        type.name = this.form.instrumentTypeOthers[index];
                    }
                    return type;
                })
                .filter(input => input.model && input.name),
            referencedDatas: this.form.referencedDatas.filter(input => input.title && input.url),
            description: this.form.description,
        };

        this.ProjectEntitiesService.create({
            data: {
                uuid: this.project.uuid,
                name: 'designsafe.project.field_recon.collection',
                entity: collection,
            }
        }).then( (res) => {
            this.data.project.addEntity(res);
            this.data.collections = this.project.collection_set;
            this.clearForm();
        }, (err) => {
            this.data.error = err;
        }).finally( () => {
            this.data.busy = false;
        });
    }

    editCollection(collection) {
        this.data.editCollection = Object.assign({}, collection);
        this.data.editCollection.value.dateStart = new Date(
            this.data.editCollection.value.dateStart
        );
        this.data.editCollection.value.dateEnd = new Date(
            this.data.editCollection.value.dateEnd
        );
        let auths = this.configureAuthors(collection);
        if (!this.data.editCollection.value.referencedDatas.length) {
            this.data.editCollection.value.referencedDatas = new Array (1);
        }
        this.form = {
            title: this.data.editCollection.value.title,
            observationTypes: this.data.editCollection.value.observationTypes,
            observationTypeOthers: this.data.editCollection.value.observationTypes,
            dateStart: this.data.editCollection.value.dateStart,
            dateEnd: this.data.editCollection.value.dateEnd,
            dataCollectors: auths,
            location: this.data.editCollection.value.location,
            longitude: this.data.editCollection.value.longitude,
            latitude: this.data.editCollection.value.latitude,
            elevation: this.data.editCollection.value.elevation,
            instruments: this.data.editCollection.value.instruments,
            instrumentTypeOthers: this.data.editCollection.value.instruments.map((instrument) => instrument.name),
            referencedDatas: this.data.editCollection.value.referencedDatas,
            description: this.data.editCollection.value.description,
        };
    }

    updateCollection($event){
        $event.preventDefault();
        this.ui.busy = true;
        this.data.editCollection.value.title = this.form.title;
        this.data.editCollection.value.observationTypes = this.form.observationTypes
            .map((type, index) => {
                if(type === 'Other' || !(this.isObservationInDropdown(index))) {
                    return this.form.observationTypeOthers[index];
                }
                return type;
            })
            .filter(input => input);
        this.data.editCollection.value.dateStart = this.form.dateStart;
        this.data.editCollection.value.dateEnd = this.form.dateEnd;
        this.data.editCollection.value.dataCollectors = this.data.users,
        this.data.editCollection.value.location = this.form.location;
        this.data.editCollection.value.longitude = this.form.longitude;
        this.data.editCollection.value.latitude = this.form.latitude;
        this.data.editCollection.value.elevation = this.form.elevation;
        this.data.editCollection.value.instruments = this.form.instruments
            .map((type, index) => {
                if(type.name === 'Other') {
                    type.name = this.form.instrumentTypeOthers[index];
                }
                return type;
            })
            .filter(input => input.model && input.name);
        this.data.editCollection.value.referencedDatas = this.form.referencedDatas.filter(input => input.title && input.url);
        this.data.editCollection.value.description = this.form.description;

        this.ProjectEntitiesService.update({
            data: {
                uuid: this.data.editCollection.uuid,
                entity: this.data.editCollection,
            }
        }).then( (res) => {
            let collection = this.data.project.getRelatedByUuid(res.uuid);
            collection.update(res);
            this.data.collections = this.project.collection_set;
            delete this.data.editCollection;
            if (window.sessionStorage.experimentData) {
                this.close({ $value: collection });
            }
            this.clearForm();
            return res;
        }).finally(()=>{
            this.ui.busy = false;
        });
    }

    deleteCollection(collection) {
        let confirmDialog = this.$uibModal.open({
            component: 'confirmDelete',
            resolve: {
                options: () => { return { entity: collection }; }
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
                    uuid: collection.uuid,
                }
            }).then( (entity) => {
                this.project.removeEntity(entity);
                this.data.collections = this.project.collection_set;
            });
        });
    }
}

export const ManageFieldReconCollectionsComponent = {
    template: ManageFieldReconCollectionsTemplate,
    controller: ManageFieldReconCollectionsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    }
};
