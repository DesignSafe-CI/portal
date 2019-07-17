import ExpPublicationTemplate from '../projects/publication-preview/publication-preview.component.html';
import SimPublicationTemplate from '../projects/publication-preview/publication-preview-sim.component.html';
import HybSimPublicationTemplate from '../projects/publication-preview/publication-preview-hyb-sim.component.html';
import FieldReconPublicationTemplate from '../projects/publication-preview/publication-preview-field-recon.component.html';
import OtherPublicationTemplate from '../projects/publication-preview/publication-preview-other.component.html';
import experimentalData from '../../../projects/components/manage-experiments/experimental-data.json';

class PublishedViewCtrl {
    constructor($stateParams, DataBrowserService, PublishedService, FileListing, $uibModal, $http, djangoUrl){
        'ngInject';
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.PublishedService = PublishedService;
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$http = $http;
        this.djangoUrl = djangoUrl;
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
                    }

                    //add metadata to header
                    this.PublishedService.updateHeaderMetadata(projId, resp);
                    this.version = this.browser.publication.version || 1;
                    this.type = this.browser.publication.project.value.projectType;
                    this.ui.loading = false;
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
        }
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

    hasEndDate(date) {
        if (Date.parse(date)) {
            return true;
        }
        return false;
    }

    download() {
        var body = {
            action: 'download'
        };
        var system = this.$stateParams.systemId;
        var projectId = this.project.value.projectId;
        
        var url = this.djangoUrl.reverse('designsafe_api:public_files_media', ['published', system, `archives/${projectId}_archive.zip`]);

        this.$http.put(url, body).then(function (resp) {
            var postit = resp.data.href;

            // Is there a better way of doing this?
            var link = document.createElement('a');
            link.style.display = 'none';
            link.setAttribute('href', postit);
            link.setAttribute('download', "null");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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

    treeDiagram(rootCategory) {
        this.$uibModal.open({
            component: 'projectTree',
            resolve: {
                project: () => {return this.browser.project; },
                rootCategoryUuid: () => {return rootCategory.uuid; },
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
