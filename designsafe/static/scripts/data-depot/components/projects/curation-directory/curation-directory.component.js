import CurationDirectoryTemplate from './curation-directory.component.html';
import _ from 'underscore';

class CurationDirectoryCtrl {

    constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state) {
        'ngInject';

        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.FileListing = FileListing;
        this.$state = $state;
    }
    
    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.browser = this.DataBrowserService.state();

        this.setEntitiesRel = (resp) => {
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href('projects.view.data', {
                    projectId: this.projectId,
                    filePath: child.path,
                    projectTitle: this.browser.project.value.projectTitle,
                });
                child.setEntities(this.projectId, resp);
            });

            this.browser.project.appendEntitiesRel(resp);
            return resp;
        };


        this.ProjectService.get({ uuid: this.projectId }).then((project) => {
            this.browser.project = project;
            this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }).then(this.setEntitiesRel);
        }).then(() => {
            this.DataBrowserService.browse(
                { system: 'project-' + this.projectId, path: this.filePath },
                { query_string: this.$state.params.query_string }
            )
                .then(() => {
                    this.browser.listing.href = this.$state.href('projects.view.data', {
                        projectId: this.projectId,
                        filePath: this.browser.listing.path,
                        projectTitle: this.browser.project.value.projectTitle,
                    });
                    this.browser.showMainListing = true;
                });
        });

    }

    matchingGroup(exp, model) {
        // match appropriate data to corresponding experiment
        var result = false;
        model.associationIds.forEach((id) => {
            if (id == exp.uuid) {
                result = true;
            }
        });
        return result;
    }
    
    goWork() {
        this.$state.go('projects.view.data', {projectId: this.browser.project.uuid});
    }

    goPreview() {
        this.$state.go('projects.preview', {projectId: this.browser.project.uuid});
    }

    editProject() {
        // need to refresh project data when this is closed (not working atm)
        this.ProjectService.editProject(this.browser.project);
    }

    manageExperiments() {
        // need to data when this is closed (not working atm)
        var experimentsAttr = this.browser.project.getRelatedAttrName('designsafe.project.experiment');
        var experiments = this.browser.project[experimentsAttr];
        if (typeof experiments === 'undefined') {
            this.browser.project[experimentsAttr] = [];
            experiments = this.browser.project[experimentsAttr];
        }
        this.ProjectService.manageExperiments({'experiments': experiments, 'project': this.browser.project});
    }

    manageSimulations() {
        // need to data when this is closed (not working atm)
        var simulationAttr = this.browser.project.getRelatedAttrName('designsafe.project.simulation');
        var simulations = this.browser.project[simulationAttr];
        if (typeof simulations === 'undefined'){
          this.browser.project[simulationAttr] = [];
          simulations = this.browser.project[simulationAttr];
        }
        this.ProjectService.manageSimulations({'simulations': simulations, 'project': this.browser.project});
    }

    manageHybridSimulations() {
        // need to data when this is closed (not working atm)
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
        // need to data when this is closed (not working atm)
        this.ProjectService.manageCategories({'project': this.browser.project});
    }
}

CurationDirectoryCtrl.$inject = ['ProjectEntitiesService', 'ProjectService', 'DataBrowserService', 'FileListing', '$state'];

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
