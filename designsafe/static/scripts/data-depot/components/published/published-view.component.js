/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable class-methods-use-this */
import { isEqual, has } from 'underscore';
import ExpPublicationTemplate from '../projects/publication-preview/publication-preview.component.html';
import SimPublicationTemplate from '../projects/publication-preview/publication-preview-sim.component.html';
import HybSimPublicationTemplate from '../projects/publication-preview/publication-preview-hyb-sim.component.html';
import FieldReconPublicationTemplate from '../projects/publication-preview/publication-preview-field-recon.component.html';
import OtherPublicationTemplate from '../projects/publication-preview/publication-preview-other.component.html';
import experimentalData from '../../../projects/components/manage-experiments/experimental-data.json';

class PublishedViewCtrl {
    constructor(
        $anchorScroll,
        $state,
        $location,
        $stateParams,
        $uibModal,
        $http,
        $q,
        FileListingService,
        FileOperationService,
        PublicationService,
        UserService
    ) {
        'ngInject';

        this.$anchorScroll = $anchorScroll;
        this.$state = $state;
        this.$location = $location;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
        this.$http = $http;
        this.$q = $q;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.PublicationService = PublicationService;
        this.UserService = UserService;
        this.loadingUserData = {
            pi: true,
            coPis: true,
        };
        this.authorData = {
            pi: {},
            coPis: null,
        };
    }

    $onInit() {
        this.readOnly = true;
        this.ui = {
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
            license: '',
            licenseType: '',
            fileNav: true,
            loading: true,
        };
        this.browser = {};
        this.browser.listings = {};
        this.browser.publication = this.publication;
        this.browser.project = this.publication.project;
        this.project = this.publication.project;
        this.uuid = this.project.uuid;
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
        this.citationCounts = {};
        this.viewCounts = {};
        this.downloadCounts = {};
        this.projId = this.$stateParams.filePath.replace(/^\/+/, '').split('/')[0];
        this.versions = this.prepVersions(this.publication);
        this.selectedVersion = this.publication.revision || 1;
        this.prjBasePath = (this.publication.revision && this.publication.revision > 0
            ? this.publication.projectId + 'v' + this.publication.revision
            : this.publication.projectId
        );
        this.openEntities = {};
        this.breadcrumbParams = {
            root: { label: this.prjBasePath, path: this.prjBasePath },
            path: this.prjBasePath,
            skipRoot: true,
        };
        this.createdYear = new Date(this.publication.created).getFullYear();
        this.projectGen = this.publication.version || 1;
        if (this.projectGen === 1) {
            // early publications - other & experimental
            this.doi = this.publication.project.doi.split(':').pop();
        } else {
            // second generation publications
            this.version = this.publication.revision || 1;
        }
        this.PublicationService.getMetrics(this.projId)
            .then((resp) => {
                this.data = resp.data;
                this.cumMetrics = this.citationMetrics(resp.data);
                this.error = false;
                this.loading = false;
            })
            .catch((e) => {
                this.error = true;
                this.loading = false;
                this.cumMetrics = {
                    projectDownloads: 0,
                    fileDownloads: 0,
                    filePreviews: 0,
                    fileViews: 0,
                    total: 0,
                    uniqueRequests: 0,
                };
            });
        
        this.getFileObjs = (evt) => {
            this.FileListingService.publishedListing(this.browser.publication, evt);
        };

        if (
            decodeURIComponent(this.$stateParams.filePath).replace('/', '') === this.projId &&
            this.browser.project.value.projectType !== 'other' &&
            !this.$stateParams.query_string
        ) {
            this.ui.fileNav = false;
        }

        if (this.ui.fileNav) {
            this.breadcrumbParams.path = this.$stateParams.filePath;
            this.FileListingService.browse({
                section: 'main',
                api: 'agave',
                scheme: 'public',
                system: 'designsafe.storage.published',
                path: this.$stateParams.filePath,
                query_string: this.$stateParams.query_string,
                doi: this.$stateParams.doi
            });
        } else {
            this.getProjectListings();
        }

        Object.keys(this.publication.licenses).forEach((key) => {
            if (this.publication.licenses[key]) {
                this.ui.license = this.publication.licenses[key];
                if (key === 'datasets') {
                    this.ui.licenseType = 'curation-odc';
                } else if (key === 'software') {
                    if (this.ui.license.includes('3-Clause BSD')) {
                        this.ui.licenseType = 'curation-3bsd';
                    } else if (this.ui.license.includes('GNU General Public')) {
                        this.ui.licenseType = 'curation-gpl';
                    }
                } else if (key === 'works') {
                    const subtype = this.ui.license.includes('Attribution') ? 'share' : 'zero';
                    this.ui.licenseType = `curation-cc-${subtype}`;
                }
            }
        });

        // add metadata to header
        this.type = this.browser.publication.project.value.projectType;
        this.prepProject();
        this.ui.loading = false;
    }

    getProjectListings() {
        if (this.browser.publication.project.value.projectType === 'experimental') {
            if (typeof this.browser.publication.analysisList !== 'undefined') {
                this.browser.publication.analysisList.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reportsList !== 'undefined') {
                this.browser.publication.reportsList.forEach(this.getFileObjs);
            }
            this.browser.publication.modelConfigs.forEach(this.getFileObjs);
            this.browser.publication.sensorLists.forEach(this.getFileObjs);
            this.browser.publication.eventsList.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'simulation') {
            if (typeof this.browser.publication.analysiss !== 'undefined') {
                this.browser.publication.analysiss.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reports !== 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            this.browser.publication.models.forEach(this.getFileObjs);
            this.browser.publication.inputs.forEach(this.getFileObjs);
            this.browser.publication.outputs.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'hybrid_simulation') {
            if (typeof this.browser.publication.analysiss !== 'undefined') {
                this.browser.publication.analysiss.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.reports !== 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.coordinator_outputs !== 'undefined') {
                this.browser.publication.coordinator_outputs.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.exp_outputs !== 'undefined') {
                this.browser.publication.exp_outputs.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.sim_outputs !== 'undefined') {
                this.browser.publication.sim_outputs.forEach(this.getFileObjs);
            }
            this.browser.publication.global_models.forEach(this.getFileObjs);
            this.browser.publication.coordinators.forEach(this.getFileObjs);
            this.browser.publication.exp_substructures.forEach(this.getFileObjs);
            this.browser.publication.sim_substructures.forEach(this.getFileObjs);
        } else if (this.browser.publication.project.value.projectType === 'field_recon') {
            if (typeof this.browser.publication.reports !== 'undefined') {
                this.browser.publication.reports.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.collections !== 'undefined') {
                this.browser.publication.collections.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.planning !== 'undefined') {
                this.browser.publication.planning.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.geoscience !== 'undefined') {
                this.browser.publication.geoscience.forEach(this.getFileObjs);
            }
            if (typeof this.browser.publication.socialscience !== 'undefined') {
                this.browser.publication.socialscience.forEach(this.getFileObjs);
            }
        }
    }

    prepProject() {
        this.doiList = {};
        if (this.project.value.projectType === 'experimental') {
            this.browser.project.analysis_set = this.browser.publication.analysisList;
            this.browser.project.modelconfig_set = this.browser.publication.modelConfigs;
            this.browser.project.sensorlist_set = this.browser.publication.sensorLists;
            this.browser.project.event_set = this.browser.publication.eventsList;
            this.browser.project.report_set = this.browser.publication.reportsList;
            this.browser.project.experiment_set = this.browser.publication.experimentsList;
            this.browser.publication.experimentsList.forEach((ent) => {
                this.doiList[ent.uuid] = { doi: ent.doi, hash: `anchor-${ent.uuid}` };
            });
        }
        if (this.project.value.projectType === 'simulation') {
            this.browser.project.simulation_set = this.browser.publication.simulations;
            this.browser.project.model_set = this.browser.publication.models;
            this.browser.project.input_set = this.browser.publication.inputs;
            this.browser.project.output_set = this.browser.publication.outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
            this.browser.publication.simulations.forEach((ent) => {
                this.doiList[ent.uuid] = { doi: ent.doi, hash: `anchor-${ent.uuid}` };
            });
        }
        if (this.project.value.projectType === 'hybrid_simulation') {
            this.browser.project.hybridsimulation_set = this.browser.publication.hybrid_simulations;
            this.browser.project.globalmodel_set = this.browser.publication.global_models;
            this.browser.project.coordinator_set = this.browser.publication.coordinators;
            this.browser.project.simsubstructure_set = this.browser.publication.sim_substructures;
            this.browser.project.expsubstructure_set = this.browser.publication.exp_substructures;
            this.browser.project.coordinatoroutput_set = this.browser.publication.coordinator_outputs;
            this.browser.project.simoutput_set = this.browser.publication.sim_outputs;
            this.browser.project.expoutput_set = this.browser.publication.exp_outputs;
            this.browser.project.analysis_set = this.browser.publication.analysiss;
            this.browser.project.report_set = this.browser.publication.reports;
            this.browser.publication.hybrid_simulations.forEach((ent) => {
                this.doiList[ent.uuid] = { doi: ent.doi, hash: `details-${ent.uuid}` };
            });
        }
        if (this.project.value.projectType === 'field_recon') {
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
            this.orderedPrimary.forEach((ent) => {
                this.doiList[ent.uuid] = {
                    doi: ent.doi,
                    type: ent.name.split('.').pop(),
                    hash: `details-${ent.uuid}`,
                };
                this.doi = this.doiList[ent.uuid];
            });
        }
        if (this.project.value.projectType === 'other') {
            this.doiList[this.project.uuid] = {doi: this.project.value.dois[0]};
        }
        if (this.doiList) {
            const dataciteRequests = Object.values(this.doiList).map(({ doi }) => {
                return this.$http.get(`/api/publications/data-cite/${doi}`);
            });
            this.$q.all(dataciteRequests).then((responses) => {
                const citations = responses.map((resp) => {
                    if (resp.status === 200) {
                        return resp.data.data.attributes;
                    }
                });
                citations.forEach((cite) => {
                    const doiObj = Object.values(this.doiList).find((x) => x.doi === cite.doi);
                    this.citationCounts[cite.doi] = cite.citationCount;
                    this.downloadCounts[cite.doi] = cite.downloadCount;
                    this.viewCounts[cite.doi] = cite.viewCount;
                    doiObj.created = cite.created;
                });
            });
        }
    }

    getVersion() {
        const path =
            this.selectedVersion > 1
                ? `${this.browser.publication.projectId}v${this.selectedVersion}`
                : this.browser.publication.projectId;
        this.$state.go(
            'publishedData',
            {
                filePath: path,
            },
            { reload: true }
        );
    }

    metricDisplay(metric) {
        if (metric === 0) return 0;
        if (metric) return metric;
        return "--";
    }

    prepVersions(publication) {
        // returns a list of publication versions
        if (publication.latestRevision) {
            const vers = [1];
            const max =
                publication.latestRevision.status === 'published'
                    ? publication.latestRevision.revision
                    : publication.latestRevision.revision - 1;
            for (let i = 2; i <= max; i++) {
                vers.push(i);
            }
            return vers;
        }
        return null;
    }

    ordered(parent, entities) {
        const order = (ent) => {
            if (ent._ui && ent._ui.orders && ent._ui.orders.length) {
                return ent._ui.orders.find((order) => order.parent === parent.uuid);
            }
            return 0;
        };
        entities.sort((a, b) => {
            if (typeof order(a) === 'undefined' || typeof order(b) === 'undefined') {
                return -1;
            }
            return order(a).value > order(b).value ? 1 : -1;
        });

        return entities;
    }

    getEF(str) {
        const efs = this.ui.efs[this.browser.project.value.projectType];
        const ef = efs.find((ef) => {
            return ef.name === str;
        });
        return ef.label;
    }

    getET(exp) {
        const ets = this.ui.experimentTypes[exp.value.experimentalFacility];
        const et = ets.find((x) => {
            return x.name === exp.value.experimentType;
        });
        return et.label;
    }

    getEQ(exp) {
        const eqts = this.ui.equipmentTypes[exp.value.experimentalFacility];
        const eqt = eqts.find((x) => {
            return x.name === exp.value.equipmentType;
        });
        return eqt.label;
    }

    isValid(ent) {
        if (ent && ent !== '' && ent !== 'None') {
            return true;
        }
        return false;
    }

    download() {
        this.$uibModal.open({
            component: 'publicationDownloadModal',
            resolve: {
                publication: () => {
                    return this.browser.publication;
                },
            },
            size: 'citation',
        });
    }

    metrics() {
        this.$uibModal.open({
            component: 'publicationMetricsModal',
            resolve: {
                publication: () => {
                    return this.browser.publication;
                },
            },
            size: 'md',
        });
    }

    entityMetrics(doi, type) {
        this.$uibModal.open({
            component: 'entityMetricsModal',
            resolve: {
                publication: () => {
                    return this.browser.publication;
                },
                doi: () => doi,
                type: () => type,
            },
            size: 'md',
        });
    }

    citationMetrics(data) {
        let projectDownloads = 0;
        const archiveMetrics = data.value.find((v) => v.doi === 'archive') || { metrics: [] };
        archiveMetrics.metrics.forEach((m) => (projectDownloads += m.Downloads));
        let fileDownloads = 0;
        let filePreviews = 0;
        this.cumDoiMetrics = {};
        data.value
            .filter((v) => v.doi !== 'archive')
            .forEach((v) => {
                v.metrics.forEach((m) => {
                    fileDownloads += m.Downloads || 0;
                    filePreviews += m.Previews || 0;
                });
            });
        data.value.forEach((v) => {
            this.cumDoiMetrics[v.doi] = {
                fileDownloads: 0,
                filePreviews: 0,
            };
            v.metrics.forEach((m) => {
                this.cumDoiMetrics[v.doi].fileDownloads += m.Downloads;
                this.cumDoiMetrics[v.doi].filePreviews += m.Previews;
            });
        });
        return {
            projectDownloads,
            fileDownloads,
            filePreviews,
            otherTotal: projectDownloads + fileDownloads 
        };
    }

    matchingGroup(exp, model) {
        if (!exp) {
            // if the category is related to the project level
            if (model.associationIds.indexOf(this.projectId) > -1 && !model.value.experiments.length) {
                return true;
            }
            return false;
        }
        // if the category is related to the experiment level
        // match appropriate data to corresponding experiment
        if (model.associationIds.indexOf(exp.uuid) > -1) {
            return true;
        }
        return false;
    }

    sortAuthors(authors) {
        if (!has(authors[0], 'order')) return authors;
        const sortedAuthors = authors.sort((a, b) => a.order - b.order);
        return sortedAuthors;
    }

    listAuthors(authors) {
        if (!has(authors[0], 'order')) return authors;
        const prepAuthors = authors.sort((a, b) => a.order - b.order);
        let listAuthors = [];
        prepAuthors.forEach((u, i, arr) => {
            if (this.browser.project.value.projectType !== 'other'){
                if (u.authorship){
                    if (i === 0 && arr.length - 1 === 0) {
                    listAuthors += `${u.lname}, ${u.fname[0]}. `;
                    } else if (i === 0 && arr.length - 1 > 0) {
                        listAuthors += `${u.lname}, ${u.fname[0]}., `;
                    } else if (i === arr.length - 1) {
                        listAuthors += `${u.fname[0]}. ${u.lname}. `;
                    } else {
                        listAuthors += `${u.fname[0]}. ${u.lname}, `;
                    }
            }
            } else {
                if (i === 0 && arr.length - 1 === 0) {
                listAuthors += `${u.lname}, ${u.fname[0]}. `;
                } else if (i === 0 && arr.length - 1 > 0) {
                    listAuthors += `${u.lname}, ${u.fname[0]}., `;
                } else if (i === arr.length - 1) {
                    listAuthors += `${u.fname[0]}. ${u.lname}. `;
                } else {
                    listAuthors += `${u.fname[0]}. ${u.lname}, `;
                }
            }
            
        });
        return listAuthors;
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
                project: () => {
                    return this.browser.project;
                },
                readOnly: () => {
                    return true;
                },
            },
            size: 'lg',
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
                publication: () => {
                    return this.browser.publication;
                },
                entity: () => {
                    return entity;
                },
                created: () => {
                    return entity ? this.doiList[entity.uuid].created : undefined;
                },
            },
            size: 'citation',
        });
    }

    showVersionInfo() {
        this.$uibModal.open({
            component: 'publishedDataModal',
            resolve: {
                publication: () => {
                    return this.publication;
                },
            },
            size: 'citation',
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
        const emptyListing = isEqual(relatedWork.shift(), { order: 0, title: '', href: '' });
        return emptyArray || emptyListing;
    }

    rmEmpty(arr) {
        return arr.filter(Boolean);
    }

    onBrowse(file, doi) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, { filePath: file.path, query_string: null, doi: doi });
        } else {
            this.FileOperationService.openPreviewModal({ api: 'agave', scheme: 'private', file, doi: doi });
        }
    }

    logEntity(entity, listName) {
        // Keep track of whether an entity is being opened (so we need to log metrics)
        // or being closed (no action needed)
        this.openEntities[entity.uuid] = !(this.openEntities[entity.uuid] ?? false);
        if (this.openEntities[entity.uuid]) {
            const { projectId } = this.publication;
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
        publication: '<',
    },
};

export const SimPublishedViewComponent = {
    template: SimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<',
    },
};

export const HybSimPublishedViewComponent = {
    template: HybSimPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<',
    },
};

export const FieldReconPublishedViewComponent = {
    template: FieldReconPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<',
    },
};

export const OtherPublishedViewComponent = {
    template: OtherPublicationTemplate,
    controller: PublishedViewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        publication: '<',
    },
};
