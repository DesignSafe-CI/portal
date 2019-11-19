import _ from 'underscore';
import ManageFieldReconCollectionsTemplate from './manage-field-recon-collections.component.html';
import collectionEquipment from './equipment-list.json';

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
        this.edit = this.resolve.edit;
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
            collections: this.project.collection_set, //old
            socialScienceCollections: this.project.socialscience_set,
            planningCollections: this.project.planning_set,
            geoscienceCollections: this.project.geoscience_set,
            reportCollections: this.project.report_set,
            project: this.project,
            users: [... new Set(members)],
            collectionTypes: [
                {name: 'designsafe.project.field_recon.planning', label:'Research Planning Collection'},
                {name: 'designsafe.project.field_recon.geoscience', label:'Engineering/Geosciences Collection'},
                {name: 'designsafe.project.field_recon.social_science', label:'Social Sciences Collection'},
                {name: 'designsafe.project.field_recon.report', label:'Reports Collection'},
            ],
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
            equipment: collectionEquipment,
        };
        this.clearForm();
        if (this.edit){
            this.editCollection(this.edit);
        }
    }

    formFields(field) {
        let researchFields = ['collectors'];
        let reportFields = ['authors'];
        let engineeringFields = [
            'collectors',
            'obsType',
            'colDates',
            'colSite',
            'equipment'
        ];
        let socialFields = [
            'collectors',
            'unitAnalysis',
            'methods',
            'modes',
            'sample',
            'colDates',
            'colSite',
            'equipment',
            'restriction'
        ];

        if (this.form.collectionType === 'designsafe.project.field_recon.planning') {
            return researchFields.includes(field);
        } else if (this.form.collectionType === 'designsafe.project.field_recon.geoscience') {
            return engineeringFields.includes(field);
        } else if (this.form.collectionType === 'designsafe.project.field_recon.social_science') {
            return socialFields.includes(field);
        } else if (this.form.collectionType === 'designsafe.project.field_recon.report') {
            return reportFields.includes(field);
        } else {
            return reportFields.includes(field);
        }
    }

    clearForm() {
        this.form = {
            observationTypes: [null],
            methods: [null],
            modes: [null],
            sampleApproach: [null],
            equipment: [{}],
            referencedData: [{}],
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

    isEquipmentInDropdown($index) {
        for ( let category in this.data.equipment ){
            let match = this.data.equipment[category].filter(e => e.name === this.form.equipment[$index]);
            if (match) {
                return true;
            }
        }
        return false;
    }

    showEquipmentDropdown($index) {
        let equipment = this.form.equipment[$index];
        return (this.isEquipmentInDropdown($index) ||
                (!equipment));
    }

    showEquipmentInput($index) {
        let equipment = this.form.equipment[$index];
        return (equipment === 'Other' ||
                (!this.isEquipmentInDropdown($index) &&
                equipment));
    }

    addMethod(){
        let last = this.form.methods.length - 1;
        if (this.form.methods[last]) {
            this.form.methods.push(null);
        }
    }

    addModes(){
        let last = this.form.modes.length - 1;
        if (this.form.modes[last]) {
            this.form.modes.push(null);
        }
    }
    
    addSampleApproach(){
        let last = this.form.sampleApproach.length - 1;
        if (this.form.sampleApproach[last]) {
            this.form.sampleApproach.push(null);
        }
    }

    addEquipment() {
        let last = this.form.equipment.length - 1;
        if (this.form.equipment[last].length && !this.form.equipment.includes('None')) {
            this.form.equipment.push({});
        }
    }

    addReferenced() {
        let last = this.form.referencedData.length - 1;
        if (this.form.referencedData[last].title) {
            this.form.referencedData.push({});
        }
    }

    validCollector(){
        for(var i = 0; i < this.form.dataCollectors.length; i++) {
            if (this.form.dataCollectors[i].authorship === true) {
                return false;
            }
        }
        return true;
    }

    configureAuthors(collection) {
        // combine project and experiment users then check if any authors need to be built into objects
        let authors = (collection.value.dataCollectors ? collection.value.dataCollectors.slice() : collection.value.authors.slice());
        let usersToClean = [
            ...new Set([
                ...this.data.users,
                ...authors])
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

    getCollection(type) {
        let collection = {
            'designsafe.project.field_recon.social_science': {
                title: this.form.title,
                unit: this.form.unit,
                methods: this.form.methods,
                modes: this.form.modes,
                sampleApproach: this.form.sampleApproach,
                sampleSize: this.form.sampleSize,
                dateStart: this.form.dateStart,
                dateEnd: this.form.dateEnd,
                dataCollectors: this.form.dataCollectors,
                location: this.form.location,
                latitude: this.form.latitude,
                longitude: this.form.longitude,
                equipment: this.form.equipment.filter(input => input.model && input.name), // FIX NAME?
                restriction: this.form.restriction,
                referencedData: this.form.referencedData.filter(input => input.title && input.url),
                description: this.form.description,
            },
            'designsafe.project.field_recon.planning': {
                title: this.form.title,
                dataCollectors: this.form.dataCollectors,
                referencedData: this.form.referencedData.filter(input => input.title && input.url),
                description: this.form.description,
            },
            'designsafe.project.field_recon.geoscience': {
                title: this.form.title,
                observationTypes: this.form.observationTypes.filter(input => input),
                dateStart: this.form.dateStart,
                dateEnd: this.form.dateEnd,
                dataCollectors: this.form.dataCollectors,
                location: this.form.location,
                latitude: this.form.latitude,
                longitude: this.form.longitude,
                equipment: this.form.equipment.filter(input => input.model && input.name), // FIX NAME?
                referencedData: this.form.referencedData.filter(input => input.title && input.url),
                description: this.form.description,
            },
            'designsafe.project.field_recon.report': {
                title: this.form.title,
                authors: this.form.dataCollectors, // we're not making a duplicate "authors" field
                referencedData: this.form.referencedData.filter(input => input.title && input.url),
                description: this.form.description,
            },
        }
        return collection[type];
    }

    // Might have to figure out what to do with existing "collections..."
    saveCollection($event) {
        if ($event) {
            $event.preventDefault();
        }
        let collection = this.getCollection(this.form.collectionType);
        this.data.busy = true;

        this.ProjectEntitiesService.create({
            data: {
                uuid: this.project.uuid,
                name: this.form.collectionType,
                entity: collection,
            }
        }).then( (res) => {
            this.data.project.addEntity(res);
            // this.data.collections = this.project.collection_set;
            this.data.socialScienceCollections = this.project.socialscience_set;
            this.data.planningCollections = this.project.planning_set;
            this.data.geoscienceCollections = this.project.geoscience_set;
            this.data.reportCollections = this.project.report_set;
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
        if (this.data.editCollection.value.dateEnd && this.data.editCollection.value.dateEnd !== 'None') {
            this.data.editCollection.value.dateEnd = new Date(this.data.editCollection.value.dateEnd);
        } else {
            this.data.editCollection.value.dateEnd = '';
        }
        
        let auths = this.configureAuthors(collection);
        if (!this.data.editCollection.value.referencedData.length) {
            this.data.editCollection.value.referencedData = new Array (1);
        }

        this.form = {
            title: this.data.editCollection.value.title,
            collectionType: this.data.editCollection.name,
            observationTypes: this.data.editCollection.value.observationTypes,
            unit: this.data.editCollection.value.unit,
            methods: this.data.editCollection.value.methods,
            modes: this.data.editCollection.value.modes,
            sampleApproach: this.data.editCollection.value.sampleApproach,
            sampleSize: this.data.editCollection.value.sampleSize,
            restriction: this.data.editCollection.value.restriction,
            dateStart: this.data.editCollection.value.dateStart,
            dateEnd: this.data.editCollection.value.dateEnd,
            dataCollectors: auths,
            location: this.data.editCollection.value.location,
            longitude: this.data.editCollection.value.longitude,
            latitude: this.data.editCollection.value.latitude,
            equipment: this.data.editCollection.value.equipment,
            referencedData: this.data.editCollection.value.referencedData,
            description: this.data.editCollection.value.description,
        };
    }

    updateCollection($event){
        $event.preventDefault();
        this.ui.busy = true;
        this.data.editCollection.value.title = this.form.title;
        if (['designsafe.project.field_recon.geoscience'].includes(this.form.collectionType)) {
            this.data.editCollection.value.observationTypes = this.form.observationTypes.filter(input => input);
        }
        if (['designsafe.project.field_recon.social_science'].includes(this.form.collectionType)) {
            this.data.editCollection.value.unit = this.form.unit;
            this.data.editCollection.value.methods = this.form.methods;
            this.data.editCollection.value.modes = this.form.modes;
            this.data.editCollection.value.sampleApproach = this.form.sampleApproach;
            this.data.editCollection.value.sampleSize = this.form.sampleSize;
            this.data.editCollection.value.restriction = this.form.restriction;
        }
        if (['designsafe.project.field_recon.social_science', 'designsafe.project.field_recon.geoscience'].includes(this.form.collectionType)) {
            this.data.editCollection.value.dateStart = this.form.dateStart;
            this.data.editCollection.value.dateEnd = (this.form.dateEnd ? this.form.dateEnd : '');
            this.data.editCollection.value.location = this.form.location;
            this.data.editCollection.value.longitude = this.form.longitude;
            this.data.editCollection.value.latitude = this.form.latitude;
            this.data.editCollection.value.equipment = this.form.equipment.filter(input => input.model && input.name);
        }
        if (['designsafe.project.field_recon.report'].includes(this.form.collectionType)) {
            this.data.editCollection.value.authors = this.form.dataCollectors;
        } else {
            this.data.editCollection.value.dataCollectors = this.form.dataCollectors;
        }
        this.data.editCollection.value.referencedData = this.form.referencedData.filter(input => input.title && input.url);
        this.data.editCollection.value.description = this.form.description;

        this.ProjectEntitiesService.update({
            data: {
                uuid: this.data.editCollection.uuid,
                entity: this.data.editCollection,
            }
        }).then( (res) => {
            let collection = this.data.project.getRelatedByUuid(res.uuid);
            collection.update(res);
            // this.data.collections = this.project.collection_set;
            this.data.socialScienceCollections = this.project.socialscience_set;
            this.data.planningCollections = this.project.planning_set;
            this.data.geoscienceCollections = this.project.geoscience_set;
            this.data.reportCollections = this.project.report_set;
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

    deleteCollection(ent) {
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
                        // this.data.collections = this.project.collection_set;
                        this.data.socialScienceCollections = this.project.socialscience_set;
                        this.data.planningCollections = this.project.planning_set;
                        this.data.geoscienceCollections = this.project.geoscience_set;
                        this.data.reportCollections = this.project.report_set;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
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
