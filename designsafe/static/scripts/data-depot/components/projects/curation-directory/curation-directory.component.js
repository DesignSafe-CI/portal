import CurationDirectoryTemplate from './curation-directory.component.html';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q, $uibModal) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.browser = this.DataBrowserService.state();
        this.$state = $state;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.data = this.ProjectService.resolveParams.data;
        this.loading = true;
        this.fl = {
            showSelect: true,
            showHeader: true,
            showTags: false,
            editTags: true,
        };

        if (this.data && this.data.listing.path == this.filePath) {
            this.browser = this.data;
            this.loading = false;
        } else {
            this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.DataBrowserService.browse(
                    { system: 'project-' + this.projectId, path: this.filePath },
                    { query_string: this.$state.params.query_string }
                ),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
            ]).then(([project, listing, entities]) => {
                this.browser.project = project;
                this.browser.project.appendEntitiesRel(entities);
                this.browser.listing = listing;
                this.browser.listing.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: this.browser.listing.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                this.browser.listing.children.forEach((child) => {
                    child.href = this.$state.href('projects.view.data', {
                        projectId: this.projectId,
                        filePath: child.path,
                        projectTitle: this.browser.project.value.projectTitle,
                    });
                    child.setEntities(this.projectId, entities);
                });
                this.loading = false;
            });
        }
    }

    isSingle(val) {
        // we will have older projects with a single award number as a string
        if (val && val.length) {
            if (typeof val[0] === 'string') {
                return true;
            }
        }
        return false;
    }

    matchingGroup(exp, entity) {
        /*
        Match appropriate entity to corresponding experiment, sim, hybsim, etc...
        TODO: might be best to have this set up in ProjectEntitiesService.
        Just want to grab entities related to primary entity
        */
        var result = false;
        entity.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid, data: this.browser, filePath: this.filePath});
    }

    goPreview() {
        if (this.browser.project.value.projectType === 'experimental') {
            this.$state.go('projects.preview', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'simulation') {
            this.$state.go('projects.previewSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
            this.$state.go('projects.previewHybSim', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'other') {
            this.$state.go('projects.previewOther', {projectId: this.browser.project.uuid, data: this.browser});
        } else if (this.browser.project.value.projectType === 'field_recon') {
            this.$state.go('projects.previewFieldRecon', {projectId: this.browser.project.uuid, data: this.browser});
        }
    }

    editProject() {
        this.ProjectService.editProject(this.browser.project);
    }

    overview() {
        this.$uibModal.open({
            component: 'manageProjectType',
            resolve: {
                options: () => { return {'project': this.browser.project, 'preview': true, 'warning': false}; },
            },
            size: 'lg',
        });
    }

    manageExperiments() {
        var experimentsAttr = this.browser.project.getRelatedAttrName('designsafe.project.experiment');
        var experiments = this.browser.project[experimentsAttr];
        if (typeof experiments === 'undefined') {
            this.browser.project[experimentsAttr] = [];
            experiments = this.browser.project[experimentsAttr];
        }
        this.ProjectService.manageExperiments({'experiments': experiments, 'project': this.browser.project});
    }

    manageSimulations() {
        var simulationAttr = this.browser.project.getRelatedAttrName('designsafe.project.simulation');
        var simulations = this.browser.project[simulationAttr];
        if (typeof simulations === 'undefined'){
          this.browser.project[simulationAttr] = [];
          simulations = this.browser.project[simulationAttr];
        }
        this.ProjectService.manageSimulations({'simulations': simulations, 'project': this.browser.project});
    }

    manageHybridSimulations() {
        var hybridSimulationAttr = this.browser.project.getRelatedAttrName(
            'designsafe.project.hybrid_simulation'
        );
        var hybridSimulations = this.browser.project[hybridSimulationAttr];
        if (typeof hybridSimulations === 'undefined'){
          this.browser.project[hybridSimulationAttr] = [];
          hybridSimulations = this.browser.project[hybridSimulationAttr];
        }
        this.ProjectService.manageHybridSimulations({'hybridSimulations': hybridSimulations, 'project': this.browser.project});
    }

    manageCategories() {
        this.$uibModal.open({
            component: 'manageCategories',
            resolve: {
                browser: () => this.browser,
            },
            size: 'lg',
        });
    }

    relateData() {
      this.$uibModal.open({
        component: 'projectTree',
        resolve: {
            project: () => {return this.browser.project; },
        },
        size: 'lg',
      });
    }

    manageFieldReconMissions() {
        this.$uibModal.open({
            component: 'fieldReconMissionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageFieldReconCollections() {
        this.$uibModal.open({
            component: 'fieldReconCollectionsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }

    manageFieldReconReports() {
        this.$uibModal.open({
            component: 'fieldReconReportsModal',
            resolve: {
                project: () => { return this.browser.project; },
            },
            size: 'lg',
        });
    }
}

export const CurationDirectoryComponent = {
    template: CurationDirectoryTemplate,
    controller: CurationDirectoryCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
