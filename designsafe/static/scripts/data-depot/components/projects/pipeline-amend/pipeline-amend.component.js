import AmendExperimentTemplate from './amend-experimental.template.html';
import experimentalData from '../../../../projects/components/manage-experiments/experimental-data.json';

class PipelineAmendCtrl {
    constructor(
        ProjectService,
        UserService,
        $uibModal,
        $state,
        $http
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
    }

    $onInit() {
        this.ui = {
            loading: true,
            missing: {},
            efs: experimentalData.experimentalFacility,
            equipmentTypes: experimentalData.equipmentTypes,
            experimentTypes: experimentalData.experimentTypes,
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        this.amendment = this.ProjectService.resolveParams.amendment;

        if (!this.publication || !this.project) {
            this.goStart();
        }
        if (!this.amendment) {
            /* Amendment Preview:
            the amendment preview (this.amendment) is a combination of
            the latest published version of the project with metadata from
            the workspace project backfilled into the fields that are
            amendable.
            */
            this.configureAmendment();
        }
        this.ui.loading = false;
    }

    configureAmendment(update='all') {
        const prj_type = this.publication.project.value.projectType;
        const unamendableFields = {
            'project': ['pi', 'coPis', 'teamMembers', 'guestMembers', 'projectId', 'projectType', 'title', 'teamOrder', 'fileTags', 'dois'],
            'entity': ['title', 'dois', 'authors', 'fileTags', 'files', 'project'],
            'experimentEntity': ['project', 'experiments', 'modelConfigs', 'sensorLists', 'files']
        }
        let prjEnts = this.project.getAllRelatedObjects();

        let primaryEntNames = [];
        let secondaryEntNames = [];
        if (prj_type == 'experimental') {
            this.ui.primaryModalName = 'manageExperimentsModal';
            this.ui.secondaryModalName = 'manageCategories';
            primaryEntNames = ['experimentsList']
            secondaryEntNames = [
                'modelConfigs',
                'sensorLists',
                'eventsList',
                'analysisList',
                'reportsList'
            ]
        } // else if (prj_type == 'simulation') ...

        if (update === 'all') {
            this.amendment = JSON.parse(JSON.stringify(this.publication));
        }
        if (update === 'all' || update === 'project') { // update project fields...
            Object.keys(this.amendment.project.value).forEach((prjKey) => {
                if (!unamendableFields.project.includes(prjKey)) {
                    this.amendment.project.value[prjKey] = this.project.value[prjKey];
                }
            });
        }
        if (update === 'all' || update === 'primary') { // update primary entity fields...
            primaryEntNames.forEach((fieldName) => {
                this.amendment[fieldName].forEach((amendEntity) => {
                    let prjEntity = prjEnts.find(ent => ent.uuid === amendEntity.uuid);
                    if (!prjEntity) {
                        this.ui.missing[amendEntity.uuid] = { 'title': amendEntity.value.title };
                    } else {
                        Object.keys(amendEntity.value).forEach((entKey) => {
                            if (!unamendableFields.entity.includes(entKey)) {
                                amendEntity.value[entKey] = prjEntity.value[entKey];
                            }
                        });
                    }
                });
            });
        }
        if (update === 'all' || update === 'secondary') { // update sub entity fields...
            secondaryEntNames.forEach((fieldName) => {
                this.amendment[fieldName].forEach((amendEntity) => {
                    // find project ent that matches amended uuid
                    let prjEntity = prjEnts.find(ent => ent.uuid === amendEntity.uuid);
                    if (!prjEntity && update === 'all') {
                        this.ui.missing[amendEntity.uuid] = { 'title': amendEntity.value.title };
                    } else {
                        Object.keys(amendEntity.value).forEach((entKey) => {
                            if (!unamendableFields.experimentEntity.includes(entKey)) {
                                amendEntity.value[entKey] = prjEntity.value[entKey];
                            }
                        });
                    }
                });
            });
        }
        Object.keys(this.amendment.licenses).forEach((key) => {
            if (this.amendment.licenses[key]) {
                this.ui.license = this.amendment.licenses[key];
                if (key === 'datasets') {
                    this.ui.licenseType = 'curation-odc';
                } else if (key === 'software') {
                    this.ui.licenseType = 'curation-gpl';
                } else if (key === 'works') {
                    let subtype = (this.ui.license.includes('Attribution') ? 'share' : 'zero');
                    this.ui.licenseType = `curation-cc-${subtype}`;
                }
            }
        });
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

    amendPrimaryEntity(amendedEnt) {
        let prjEntity = this.project.getAllRelatedObjects()
            .find(ent => ent.uuid == amendedEnt.uuid);
        this.$uibModal.open({
            component: this.ui.primaryModalName,
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

    amendSecondaryEntity(amendedEnt) {
        let prjEntity = this.project.getAllRelatedObjects()
            .find(ent => ent.uuid == amendedEnt.uuid);        
        if (prjEntity) {
            this.$uibModal.open({
                component: this.ui.secondaryModalName,
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
        let efs = this.ui.efs[this.publication.project.value.projectType];
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
