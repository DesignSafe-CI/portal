import ExpPublicationTemplate from '../projects/publication-preview/publication-preview.component.html';
import SimPublicationTemplate from '../projects/publication-preview/publication-preview-sim.component.html';
import HybSimPublicationTemplate from '../projects/publication-preview/publication-preview-hyb-sim.component.html';
import FieldReconPublicationTemplate from '../projects/publication-preview/publication-preview-field-recon.component.html';
import OtherPublicationTemplate from '../projects/publication-preview/publication-preview-other.component.html';
import experimentalData from '../../../projects/components/manage-experiments/experimental-data.json';
import { isEqual, has } from 'underscore';
import { publish } from 'rxjs/operators';

class PublishedViewCtrl {
    constructor($anchorScroll, $state, $location, $stateParams, $uibModal, $http, FileListingService, FileOperationService, PublicationService, UserService){
        'ngInject';
        this.$anchorScroll = $anchorScroll;
        this.$state = $state;
        this.$location = $location;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.PublicationService= PublicationService;
        this.UserService = UserService;
        this.loadingUserData = {
            pi: true,
            coPis: true,
        };
        this.authorData = {
            pi: {},
            coPis: null,
        };
        this.$http = $http;
    }

    $onInit() {
        this.readOnly = true;
        this.ui = {
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            fileNav: true,
            loading: true,
        };
        this.browser = {}
        this.browser.listings = {};
        this.browser.publication = this.publication;
        this.browser.project = this.publication.project;
        this.project = this.publication.project;
        const { pi } = this.project.value;
        this.UserService.get(pi).then((res) => {
            this.authorData.pi = {
                fname: res.first_name,
                lname: res.last_name,
                email: res.email,
                name: res.username,
                inst: res.profile.institution,
            };
            this.loadingUserData.pi = false;
        });
        if (this.project.value.coPis) {
            this.authorData.coPis = new Array(this.project.value.coPis.length);
            this.project.value.coPis.forEach((coPi, idx) => {
                this.UserService.get(coPi).then((res) => {
                    this.authorData.coPis[idx] = {
                        fname: res.first_name,
                        lname: res.last_name,
                        email: res.email,
                        name: res.username,
                        inst: res.profile.institution,
                    };
                    if (idx === this.project.value.coPis.length - 1) this.loadingUserData.coPis = false;
                });
            });
        }

        this.projId = this.$stateParams.filePath.replace(/^\/+/, '').split('/')[0];
        this.versions = this.prepVersions(this.publication);
        this.selectedVersion = this.publication.revision || 'Original';
        this.prjBasePath = (this.publication.revision && this.publication.revision > 0
            ? this.publication.projectId + 'v' + this.publication.revision
            : this.publication.projectId
        );
        this.openEntities = {}
        this.breadcrumbParams = {
            root: {label: this.prjBasePath, path: this.prjBasePath},
            path: this.prjBasePath,
            skipRoot: true
        }

        this.getFileObjs = (evt) => {
            this.FileListingService.publishedListing(this.browser.publication, evt)
        };

        if (decodeURIComponent(this.$stateParams.filePath).replace('/',  '') === this.projId && this.browser.project.value.projectType !== 'other' && !this.$stateParams.query_string) {
            this.ui.fileNav = false;
        }

        if (this.ui.fileNav) {
            this.breadcrumbParams.path = this.$stateParams.filePath
            this.FileListingService.browse({
                section: 'main',
                api: 'agave',
                scheme: 'public',
                system: 'designsafe.storage.published',
                path: this.$stateParams.filePath,
                query_string: this.$stateParams.query_string,
            });
        }
        else {
            this.getProjectListings();
        }

        //add metadata to header
        this.type = this.browser.publication.project.value.projectType;
        this.prepProject();
        this.ui.loading = false;
    }

    getProjectListings() {
        if (this.browser.publication.project.value.projectType === 'experimental') {
            if (typeof this.browser.publication.analysisList != 'undefined') {
                this.browser.publication.analysisList.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reportsList != 'undefined') {
                this.browser.publication.reportsList.forEach(this.getFileObjs);
            }
            this.browser.publication.modelConfigs.forEach(this.getFileObjs);
            this.browser.publication.sensorLists.forEach(this.getFileObjs);
            this.browser.publication.eventsList.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'simulation') {
            if (typeof this.browser.publication.analysiss != 'undefined') {
                this.browser.publication.analysiss.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reports != 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            this.browser.publication.models.forEach(this.getFileObjs);
            this.browser.publication.inputs.forEach(this.getFileObjs);
            this.browser.publication.outputs.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'hybrid_simulation') {
            if (typeof this.browser.publication.analysiss != 'undefined') {
                this.browser.publication.analysiss.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reports != 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.coordinator_outputs != 'undefined') {
                this.browser.publication.coordinator_outputs.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.exp_outputs != 'undefined') {
                this.browser.publication.exp_outputs.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.sim_outputs != 'undefined') {
                this.browser.publication.sim_outputs.forEach(this.getFileObjs);
            }
            this.browser.publication.global_models.forEach(this.getFileObjs);
            this.browser.publication.coordinators.forEach(this.getFileObjs);
            this.browser.publication.exp_substructures.forEach(this.getFileObjs);
            this.browser.publication.sim_substructures.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'field_recon') {
            if (typeof this.browser.publication.analysiss != 'undefined') {
                this.browser.publication.analysiss.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reports != 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.collections != 'undefined') {
                this.browser.publication.collections.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.planning != 'undefined') {
                this.browser.publication.planning.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.geoscience != 'undefined') {
                this.browser.publication.geoscience.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.socialscience != 'undefined') {
                this.browser.publication.socialscience.forEach(this.getFileObjs);
            }
        }
    }

    prepProject() {
        if (this.project.value.projectType === 'experimental'){
            this.browser.project.analysis_set = this.browser.publication.analysisList;
            this.browser.project.modelconfig_set = this.browser.publication.modelConfigs;
            this.browser.project.sensorlist_set = this.browser.publication.sensorLists;
            this.browser.project.event_set = this.browser.publication.eventsList;
            this.browser.project.report_set = this.browser.publication.reportsList;
            this.browser.project.experiment_set = this.browser.publication.experimentsList;
            this.expDOIList = this.browser.project.experiment_set.map(({ doi, uuid }) => {
                return { value: doi, uuid, hash: `anchor-${uuid}` };
            });

        }
        if (this.project.value.projectType === 'simulation'){
            this.browser.project.simulation_set = this.browser.publication.simulations;
            this.browser.project.model_set = this.browser.publication.models;
            this.browser.project.input_set = this.browser.publication.inputs;
            this.browser.project.output_set = this.browser.publication.outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
            this.simDOIList = this.browser.project.simulation_set.map(({ doi, uuid }) => {
                return { value: doi, uuid, hash: `anchor-${uuid}` };
            });
        }
        if (this.project.value.projectType === 'hybrid_simulation'){
            this.browser.project.hybridsimulation_set = this.browser.publication.hybrid_simulations;
            this.browser.project.globalmodel_set = this.browser.publication.global_models;
            this.browser.project.coordinator_set = this.browser.publication.coordinators;
            this.browser.project.simsubstructure_set = this.browser.publication.sim_substructures;
            this.browser.project.expsubstructure_set = this.browser.publication.exp_substructures;
            this.browser.project.coordinatoroutput_set = this.browser.publication.coordintaor_outputs;
            this.browser.project.simoutput_set = this.browser.publication.sim_outputs;
            this.browser.project.expoutput_set = this.browser.publication.exp_outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
            this.hsDOIList = this.browser.project.hybridsimulation_set.map(({ doi, uuid }) => ({
                value: doi,
                uuid,
                hash: `details-${uuid}`,
            }));
        }
        if (this.project.value.projectType === 'field_recon'){
            this.browser.project.mission_set = this.browser.publication.missions;
            this.browser.project.collection_set = this.browser.publication.collections;
            this.browser.project.socialscience_set = this.browser.publication.socialscience;
            this.browser.project.planning_set = this.browser.publication.planning;
            this.browser.project.geoscience_set = this.browser.publication.geoscience;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
            this.primaryEnts = [].concat(
                this.browser.publication.missions || [],
                this.browser.publication.reports || []
            );
            this.secondaryEnts = [].concat(
                this.browser.publication.socialscience || [],
                this.browser.publication.planning || [],
                this.browser.publication.geoscience || [],
                this.browser.publication.collections || []
            );
            this.orderedPrimary = this.ordered(this.browser.project, this.primaryEnts);
            this.orderedSecondary = {};
            this.orderedPrimary.forEach((primEnt) => {
                if (primEnt.name === 'designsafe.project.field_recon.mission') {
                    this.orderedSecondary[primEnt.uuid] = this.ordered(primEnt, this.secondaryEnts);
                }
            });
            this.frDOIList = this.orderedPrimary.map(({ doi, uuid, name }) => ({
                type: name.split('.').pop(),
                value: doi,
                uuid,
                hash: `anchor-${uuid}`
            }));
        }
    }

    getVersion() {
        let path = (typeof this.selectedVersion === 'number'
            ? `${this.browser.publication.projectId}v${this.selectedVersion}`
            : this.browser.publication.projectId
        )
        this.$state.go('publishedData', {
            filePath: path,
        }, { reload: true });
    }

    prepVersions(publication) {
        // returns a list of publication versions
        if (publication.latestRevision) {
            let vers = ['Original'];
            let max = (publication.latestRevision.status === 'published'
                ? publication.latestRevision.revision
                : publication.latestRevision.revision - 1
            )
            if (typeof max == 'number') {
                for (let i = 2; i <= max; i++) {
                    vers.push(i);
                }
            }
            return vers;
        }
        return null;
    }

    ordered(parent, entities) {
        let order = (ent) => {
            if (ent._ui && ent._ui.orders && ent._ui.orders.length) {
                return ent._ui.orders.find(order => order.parent === parent.uuid);
            }
            return 0;
        };
        entities.sort((a,b) => {
            if (typeof order(a) === 'undefined' || typeof order(b) === 'undefined') {
                return -1;
            }
            return (order(a).value > order(b).value) ? 1 : -1;
        });

        return entities;
    }

    getEF(str) {
        let efs = this.ui.efs[this.browser.project.value.projectType];
        let ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        let et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        let eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    download() {
        this.$uibModal.open({
            component: 'publicationDownloadModal',
            resolve: {
                publication: () => {return this.browser.publication;},
            },
            size: 'citation'
        });
    }

    metrics() {
        this.$uibModal.open({
            component: 'publicationMetricsModal',
            resolve: {
                publication: () => {return this.browser.publication;},
            },
            size: 'md'
        });
    }

    entityMetrics(doi, type) {
        this.$uibModal.open({
            component: 'entityMetricsModal',
            resolve: {
                publication: () => {return this.browser.publication;},
                doi: () => doi,
                type: () => type
            },
            size: 'md'
        });
    }

    matchingGroup(exp, model) {
        if (!exp) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
                return true;
            }
            return false;
        } else {
            // if the category is related to the experiment level
            // match appropriate data to corresponding experiment
            if(model.associationIds.indexOf(exp.uuid) > -1) {
                return true;
            }
            return false;
        }
    }

    sortAuthors(authors) {
        if (!has(authors[0], 'order')) return authors;
        const sortedAuthors = authors.sort((a, b) => a.order - b.order);
        return sortedAuthors;
    }

    showAuthor(author) {
        this.$uibModal.open({
            component: 'authorInformationModal',
            resolve: {
                author,
            },
            size: 'author',
        });
    }

    treeDiagram() {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
                readOnly: () => {return true;},
            },
            size: 'lg'
        });
    }

    leaveFeedback() {
        this.$uibModal.open({
            component: 'leaveFeedbackModal',
            size: 'md',
            windowClass: 'feedback-modal',
            resolve: {
                project: () => {
                    return this.browser.project;
                },
            },
        });
    }

    showCitation(entity) {
        this.$uibModal.open({
            component: 'publishedCitationModal',
            resolve: {
                publication: () => { return this.browser.publication; },
                entity: () => { return entity; },
            },
            size: 'citation'
        });
    }

    showVersionInfo() {
        let date = new Date(this.browser.publication.revisionDate);
        let modalData = [
            {label: 'Version', data: this.browser.publication.revision},
            {label: 'Date of Publication', data: `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`},
            {label: null, data: this.browser.publication.revisionText}
        ]
        this.$uibModal.open({
            component: 'publishedDataModal',
            resolve: {
                data: () => { return modalData },
            },
            size: 'citation'
        });
    }

    goToHash(hash) {
        this.$location.hash(hash);
        this.$anchorScroll.yOffset = 64;
        return setTimeout(() => this.$anchorScroll(), 750);
    }

    relatedWorkEmpty() {
        const relatedWork = this.browser.project.value.associatedProjects.slice();
        const emptyArray = relatedWork.length === 0;
        const emptyListing = isEqual(relatedWork.shift(),{ order: 0, title: '', href: ''});
        return emptyArray || emptyListing;
    }

    rmEmpty(arr) {
        return arr.filter(Boolean);
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path, query_string: null})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

    logEntity(entity, listName) {
        // Keep track of whether an entity is being opened (so we need to log metrics)
        // or being closed (no action needed)
        this.openEntities[entity.uuid] = !(this.openEntities[entity.uuid] ?? false)
        if (this.openEntities[entity.uuid]) {
            const projectId = this.publication.projectId;
            const identifier = entity.doi || entity.uuid;
            const path = `${projectId}/${listName}/${identifier}`;
            this.$http.get(`/api/datafiles/agave/public/logentity/designsafe.storage.published/${path}`);
        }
    }
}

export const ExpPublishedViewComponent = {
    template: ExpPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<'
    }
};

export const SimPublishedViewComponent = {
    template: SimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<'
    }
};

export const HybSimPublishedViewComponent = {
    template: HybSimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<'
    }
};

export const FieldReconPublishedViewComponent = {
    template: FieldReconPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<'
    }
};

export const OtherPublishedViewComponent = {
    template: OtherPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<'
    }
};
