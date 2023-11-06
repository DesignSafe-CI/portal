import AmendExperimentTemplate from './amend-experimental.template.html';
import AmendFieldReconTemplate from './amend-field-recon.template.html';
import AmendSimulationTemplate from './amend-simulation.template.html';
import AmendHybridSimTemplate from './amend-hybrid-sim.template.html';
import facilityData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PipelineAmendCtrl {
    constructor(
        ProjectService,
        UserService,
        $uibModal,
        $state,
        $http,
        $q,
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true,
            missing: {},
            efs: facilityData.facility,
            equipmentTypes: facilityData.equipmentTypes,
            experimentTypes: facilityData.experimentTypes,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        this.amendment = this.ProjectService.resolveParams.amendment;

        if (!this.publication || !this.project) {
            this.goStart();
        }

        /* Amendment Preview:
        the amendment preview (this.amendment) is a combination of
        the latest published version of the project with metadata from
        the workspace project backfilled into the fields that are
        amendable.
        */
        this.configureAmendment();

        //make sure FR objects get sorted correctly before rendering template
        if(this.project.value.projectType == 'field_recon'){
            this.configFR();
        }
        this.ui.loading = false;
    }

    configureAmendment(update='all') {
        const prj_type = this.publication.project.value.projectType;
        const unamendableFields = {
            'project': ['pi', 'coPis', 'teamMembers', 'guestMembers', 'projectId', 'projectType', 'title', 'teamOrder', 'fileTags', 'dois'],
            'entity': ['title', 'dois', 'authors', 'fileTags', 'files', 'project'],
            'experimentEntity': ['project', 'experiments', 'modelConfigs', 'sensorLists', 'files'],
            'reportEntity': ['project','files','authors','dois'],
            'missionEntity': ['project','files','authors','dois'],
            'simulationEntity': ['project','files','authors','dois'],
            'hybsimEntity': ['project','files','authors','dois'],
        }
        let prjEnts = this.project.getAllRelatedObjects();

        let primaryEntNames = [];
        let secondaryEntNames = [];
        if (prj_type == 'experimental') {
            primaryEntNames = ['experimentsList']
            secondaryEntNames = [
                'modelConfigs',
                'sensorLists',
                'eventsList',
                'analysisList',
                'reportsList'
            ]
        }
        else if (prj_type == 'field_recon') {
            primaryEntNames = ['missions','reports']
            secondaryEntNames = [
                'geoscience',
                'planning',
                'socialscience'
            ]
        }
        else if (prj_type == 'simulation') {
            primaryEntNames = ['simulations']
            secondaryEntNames = [
                'simulation',
                'models',
                'inputs',
                'outputs',
                'analysiss',
                'reports'
            ]
        }
        else if (prj_type == 'hybrid_simulation') {
            primaryEntNames = ['hybidsimulations']
            secondaryEntNames = [
                'hybrid_simulations',
                'global_models',
                'coordinators',
                'sim_substructures',
                'exp_substructures',
                'coordinator_outputs',
                'sim_outputs',
                'exp_outputs',
                'analysiss',
                'reports'
            ]
        }
        if (update === 'all') {
            this.amendment = JSON.parse(JSON.stringify(this.publication));
        }
        if (update === 'all' || update === 'project') { // update project fields...
            Object.keys(this.project.value).forEach((prjKey) => {
                if (!unamendableFields.project.includes(prjKey)) {
                    this.amendment.project.value[prjKey] = this.project.value[prjKey];
                }
            });
        }
        if (update === 'all' || update === 'primary') { // update primary entity fields...
            primaryEntNames.forEach((fieldName) => {
                if (fieldName in this.amendment) {
                    this.amendment[fieldName].forEach((amendEntity) => {
                        let prjEntity = prjEnts.find(ent => ent.uuid === amendEntity.uuid);
                        if (!prjEntity) {
                            this.ui.missing[amendEntity.uuid] = { 'title': amendEntity.value.title };
                        } else {
                            Object.keys(prjEntity.value).forEach((entKey) => {
                                if (!unamendableFields.entity.includes(entKey)) {
                                    amendEntity.value[entKey] = prjEntity.value[entKey];
                                }
                            });
                        }
                    });
                }
            });
        }
        if (update === 'all' || update === 'secondary') { // update sub entity fields...
            secondaryEntNames.forEach((fieldName) => {
                if (fieldName in this.amendment) {
                    this.amendment[fieldName].forEach((amendEntity) => {
                        // find project ent that matches amended uuid
                        let prjEntity = prjEnts.find(ent => ent.uuid === amendEntity.uuid);
                        if (!prjEntity && update === 'all') {
                            this.ui.missing[amendEntity.uuid] = { 'title': amendEntity.value.title };
                        } else {
                            Object.keys(amendEntity.value).forEach((entKey) => {
                                if (!unamendableFields.experimentEntity.includes(entKey)) {
                                    amendEntity.value[entKey] = prjEntity.value[entKey];
                                } else if (!unamendableFields.simulationEntity.includes(entKey)) {
                                    amendEntity.value[entKey] = prjEntity.value[entKey];
                                }
                            });
                        } 
                    });
                }
            });
        }
        Object.keys(this.amendment.licenses).forEach((key) => {
            if (this.amendment.licenses[key]) {
                this.ui.license = this.amendment.licenses[key];
                if (key === 'datasets') {
                    this.ui.licenseType = 'curation-odc';
                } else if (key === 'software') {
                    if (this.ui.license.includes('3-Clause BSD')) {
                        this.ui.licenseType = 'curation-3bsd';
                    } else {
                        this.ui.licenseType = 'curation-gpl';
                    }
                } else if (key === 'works') {
                    let subtype = (this.ui.license.includes('Attribution') ? 'share' : 'zero');
                    this.ui.licenseType = `curation-cc-${subtype}`;
                }
            }
        });
    }

    configFR() {
        //TODO: refactor ordering technical debt
        this.doiList = {}
        this.primaryEnts = [].concat(
            this.amendment.missions || [],
            this.amendment.reports || []
        );
        this.secondaryEnts = [].concat(
            this.amendment.socialscience || [],
            this.amendment.planning || [],
            this.amendment.geoscience || [],
            // TODO: throw error if collections found in publication or project
        );
        this.orderedPrimary = this.ordered(this.project, this.primaryEnts);
        this.orderedSecondary = {};
        this.orderedPrimary.forEach((primEnt) => {
            if (primEnt.name === 'designsafe.project.field_recon.mission') {
                this.orderedSecondary[primEnt.uuid] = this.ordered(primEnt, this.secondaryEnts);
            }
        });

        this.orderedPrimary.forEach((ent) => {
            this.doiList[ent.uuid] = {
                doi: ent.doi,
                type: ent.name.split('.').pop(),
                hash: `details-${ent.uuid}`
            }
        });
        if (this.doiList) {
            let dataciteRequests = Object.values(this.doiList).map(({doi}) => {
                return this.$http.get(`/api/publications/data-cite/${doi}`);
            });
            this.$q.all(dataciteRequests).then((responses) => {
                let citations = responses.map((resp) => {
                    if (resp.status == 200) {
                        return resp.data.data.attributes
                    }
                });
                citations.forEach((cite) => {
                    let doiObj = Object.values(this.doiList).find(x => x.doi === cite.doi);
                    doiObj['created'] = cite.created;
                })
            });
        }
    }

    amendProject() {
        return this.$uibModal.open({
            component: 'amendProject',
            resolve: {
                project: () => this.project,
            },
            backdrop: 'static',
            size: 'lg',
        }).closed.then((_) => {
            this.configureAmendment('project');
        });
    }

    amendPrimaryEntity(amendedEnt, primaryModalName) {
        let prjEntity = this.project.getAllRelatedObjects()
            .find(ent => ent.uuid == amendedEnt.uuid);
        this.$uibModal.open({
            component: primaryModalName,
            resolve: {
                project: () => this.project,
                edit: () => prjEntity,
            },
            backdrop: 'static',
            size: 'lg',
        }).closed.then((_) => {
            this.configureAmendment('primary');
        });
    }

    amendSecondaryEntity(amendedEnt, secondaryModalName) {
        let prjEntity = this.project.getAllRelatedObjects()
            .find(ent => ent.uuid == amendedEnt.uuid);
        if (prjEntity) {
            this.$uibModal.open({
                component: secondaryModalName,
                resolve: {
                    project: () => this.project,
                    edit: () => prjEntity,
                },
                backdrop: 'static',
                size: 'lg',
            }).closed.then((_) => {
                this.configureAmendment('secondary');
            });
        } else {
            this.$uibModal.open({
                component: 'amendEntityModal',
                resolve: {
                    entity: () => amendedEnt,
                    missing: () => this.ui.missing,
                },
                backdrop: 'static',
                size: 'lg',
            });
        }
    }

    goCitation() {
        this.$state.go('projects.amendCitation', {
            projectId: this.project.uuid,
            project: this.project,
            publication: this.publication,
            amendment: this.amendment
        }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    getEF(str) {
        if (str !='' && str !='None') {
            let efs = this.ui.efs.facilities_list;
            let ef = efs.find((ef) => {
                return ef.name === str;
            });
            return ef.label;
        }
    }

    getET(exp) {
        if (exp.value.experimentalFacility == 'ohhwrl-oregon' || exp.value.experimentalFacility == 'eqss-utaustin' ||
            exp.value.experimentalFacility == 'cgm-ucdavis' || exp.value.experimentalFacility == 'lhpost-sandiego' ||        
            exp.value.experimentalFacility == 'rtmd-lehigh' || exp.value.experimentalFacility == 'pfsml-florida' ||
            exp.value.experimentalFacility == 'wwhr-florida' || exp.value.experimentalFacility == 'other') 
            {
            let ets = this.ui.experimentTypes[exp.value.experimentalFacility];
            let et = ets.find((x) => {
                return x.name === exp.value.experimentType;
            });
            return et.label;
        }
    }

    getEQ(exp) {
        if (exp.value.experimentalFacility == 'ohhwrl-oregon' || exp.value.experimentalFacility == 'eqss-utaustin' ||
            exp.value.experimentalFacility == 'cgm-ucdavis' || exp.value.experimentalFacility == 'lhpost-sandiego' ||        
            exp.value.experimentalFacility == 'rtmd-lehigh' || exp.value.experimentalFacility == 'pfsml-florida' ||
            exp.value.experimentalFacility == 'wwhr-florida' || exp.value.experimentalFacility == 'other') 
            {
            let eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
            let eqt = eqts.find((x) => {
                return x.name === exp.value.equipmentType;
            });
            return eqt.label;
        }
    }

    sortAuthors(authors) {
        if (authors.length && 'order' in authors[0]) return authors;
        const sortedAuthors = authors.sort((a, b) => a.order - b.order);
        return sortedAuthors;
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

    showCitation(entity) {
        this.$uibModal.open({
            component: 'publishedCitationModal',
            resolve: {
                publication: () => { return this.amendment; },
                entity: () => { return entity; },
            },
            size: 'citation'
        });
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
}

export const AmendExperimentComponent = {
    template: AmendExperimentTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendFieldReconComponent = {
    template: AmendFieldReconTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendSimulationComponent = {
    template: AmendSimulationTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const AmendHybSimComponent = {
    template: AmendHybridSimTemplate,
    controller: PipelineAmendCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}; 
