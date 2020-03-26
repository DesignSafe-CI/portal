import ExpPublicationTemplate from '../projects/publication-preview/publication-preview.component.html';
import SimPublicationTemplate from '../projects/publication-preview/publication-preview-sim.component.html';
import HybSimPublicationTemplate from '../projects/publication-preview/publication-preview-hyb-sim.component.html';
import FieldReconPublicationTemplate from '../projects/publication-preview/publication-preview-field-recon.component.html';
import OtherPublicationTemplate from '../projects/publication-preview/publication-preview-other.component.html';
import experimentalData from '../../../projects/components/manage-experiments/experimental-data.json';

class PublishedViewCtrl {
    constructor($stateParams, $uibModal, DataBrowserService, PublishedService, UserService, FileListing){
        'ngInject';
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
        this.DataBrowserService = DataBrowserService;
        this.PublishedService = PublishedService;
        this.UserService = UserService;
        this.FileListing = FileListing;
    }

    $onInit() {
        //this.version = this.resolve.version;
        this.readOnly = true;
        this.ui = {
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            fileNav: true,
            loading: true,
        };
        this.browser = this.DataBrowserService.state();
        this.browser.listings = {};
        var projId = this.$stateParams.filePath.replace(/^\/+/, '').split('/')[0];

        this.getFileObjs = (evt) => {
            evt.files = evt.fileObjs.map((f) => {
                f.system = 'designsafe.storage.published';
                f.path = this.browser.publication.projectId + f.path;
                f.permissions = 'READ';
                return this.FileListing.init(f, {fileMgr: 'published', baseUrl: '/api/public/files'});
            });
            evt.files.forEach((file) => {
                if (!this.browser.listings[evt.uuid]) {
                    this.browser.listings[evt.uuid] = { children: [] };
                }
                this.browser.listings[evt.uuid].children.push(file);
            });
            this.browser.listings[evt.uuid].children.forEach((child) => {
                child._entities.push(evt);
            });
        };

        if (this.$stateParams.filePath.replace('/',  '') === projId) {
            this.ui.fileNav = false;
        }

        if (projId) {
            this.PublishedService.getPublished(projId)
                .then((resp) => {
                    this.browser.publication = resp.data;
                    this.browser.project = resp.data.project;
                    this.project = resp.data.project;
                    this.fl = {
                        showSelect: true,
                        showHeader: this.browser.project.value.projectType === 'other',
                        showTags: true,
                        editTags: false,
                    };

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

                        this.browser.publication.hybrid_simulations.forEach(this.getFileObjs);
                        this.browser.publication.global_models.forEach(this.getFileObjs);
                        this.browser.publication.coordinators.forEach(this.getFileObjs);
                        this.browser.publication.coordinator_outputs.forEach(this.getFileObjs);
                        this.browser.publication.exp_substructures.forEach(this.getFileObjs);
                        this.browser.publication.exp_outputs.forEach(this.getFileObjs);
                        this.browser.publication.sim_substructures.forEach(this.getFileObjs);
                        this.browser.publication.sim_outputs.forEach(this.getFileObjs);
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
                    
                    //add metadata to header
                    this.PublishedService.updateHeaderMetadata(projId, resp);
                    this.version = this.browser.publication.version || 1;
                    this.type = this.browser.publication.project.value.projectType;
                    this.ui.loading = false;
                    
                    // // Generate text for PI
                    // this.piDisplay = this.browser.publication.authors.find((author) => author.name === this.browser.project.value.pi);
                    // // Generate CoPI list
                    // this.coPIDisplay = this.project.value.coPis.map((coPi) => this.browser.publication.authors.find((author) => author.name === coPi));
                }).then( () => {
                    this.prepProject();
                });
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
        }
        if (this.project.value.projectType === 'simulation'){
            this.browser.project.simulation_set = this.browser.publication.simulations;
            this.browser.project.model_set = this.browser.publication.models;
            this.browser.project.input_set = this.browser.publication.inputs;
            this.browser.project.output_set = this.browser.publication.outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
        }
        if (this.project.value.projectType === 'hybrid_simulation'){
            this.browser.project.hybridsimlation_set = this.browser.publication.hybrid_simulations;
            this.browser.project.globalmodel_set = this.browser.publication.global_models;
            this.browser.project.coordinator_set = this.browser.publication.coordinators;
            this.browser.project.simsubstructure_set = this.browser.publication.sim_substructures;
            this.browser.project.expsubstructure_set = this.browser.publication.exp_substructures;
            this.browser.project.coordinatoroutput_set = this.browser.publication.coordintaor_outputs;
            this.browser.project.simoutput_set = this.browser.publication.sim_outputs;
            this.browser.project.expoutput_set = this.browser.publication.exp_outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
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
        }
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

    download() {
        this.$uibModal.open({
            component: 'publicationDownloadModal',
            resolve: {
                project: () => {return this.browser.project;},
                mediaUrl: () => {return this.browser.listing.mediaUrl();},
            },
            size: 'lg'
        });
        // let body = { action: 'download' };
        // let projectId = this.project.value.projectId;
        // let baseUrl = this.browser.listing.mediaUrl();
        // baseUrl = baseUrl.split('/').filter(x =>  x != '' && x != projectId).join('/');
        
        // let url = `/${baseUrl}/archives/${projectId}_archive.zip`;

        // this.$http.put(url, body).then(function (resp) {
        //     let postit = resp.data.href;
        //     let link = document.createElement('a');
        //     link.style.display = 'none';
        //     link.setAttribute('href', postit);
        //     link.setAttribute('download', "null");
        //     document.body.appendChild(link);
        //     link.click();
        //     document.body.removeChild(link);
        // });
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

    showAuthor(author) {
        this.UserService.get(author.name).then((res) => {
            if (res.orcid_id) {
                author.orcid = res.orcid_id;
            }
            this.$uibModal.open({
                component: 'authorInformationModal',
                resolve: {
                    author
                },
                size: 'author'
            });
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

    showCitation(entity) {
        this.$uibModal.open({
            component: 'publishedCitationModal',
            resolve: {
                publication: () => { return this.browser.publication; },
                entity: () => { return entity; },
            }
        });
    }
}

export const ExpPublishedViewComponent = {
    template: ExpPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
};

export const SimPublishedViewComponent = {
    template: SimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
};

export const HybSimPublishedViewComponent = {
    template: HybSimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
};

export const FieldReconPublishedViewComponent = {
    template: FieldReconPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
};

export const OtherPublishedViewComponent = {
    template: OtherPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
};
