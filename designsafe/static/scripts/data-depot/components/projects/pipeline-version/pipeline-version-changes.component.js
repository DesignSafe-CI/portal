import VersionChanges from './version-changes.template.html';

class PipelineVersionChangesCtrl {
    constructor(
        ProjectService,
        $uibModal,
        $state,
        $http,
        $q
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true,
            success: false,
            warning: false,
            error: false,
            submitted: false,
            confirmed: false,
            selectionComp: '',
            citationComp: ''
        };
        console.log('Hello PipelineVersionChangesCtrl');
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.project = this.ProjectService.resolveParams.project;
        this.publication = this.ProjectService.resolveParams.publication;

        this.selectedListing = this.ProjectService.resolveParams.selectedListing; // other
        this.revisionText = '';

        if (!this.publication || !this.project) {
            this.goStart();
        } else {
            console.log('Ready to fight');
            // load what is necessary for the changes area...
            console.log(this.project);
            switch(this.project.value.projectType) {
                case 'experimental': {
                    this.ui.selectionComp = 'projects.versionExperimentSelection'
                    this.ui.citationComp = 'projects.versionExperimentCitation'
                    // configure publication data for versioning request...
                    break;
                }
                case 'other': {
                    this.authors = this.publication.project.value.teamOrder
                    this.ui.selectionComp = 'projects.versionOtherSelection'
                    this.ui.citationComp = 'projects.versionOtherCitation'
                    this.pubData = {
                        project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                        license: this.publication.licenses
                    };
                }
            }
            this.ui.loading = false;
        }
    }

    submitVersion() {
        this.ui.warning = false;
        if (this.revisionText.length < 10) {
            return this.ui.warning = true;
        }
        this.ui.loading = true;
        let filePaths = (this.selectedListing
            ? this.selectedListing.listing.map((file) => file.path)
            : null);
        console.log({
                publication: this.pubData,
                mainEntityUuids: this.mainEntityUuids,
                selectedFiles: filePaths,
                revision: true,
                revisionText: this.revisionText,
                revisionAuthors: this.authors,
                status: 'publishing'
            });
        // this.$http.post(
        //     '/api/projects/publication/',
        //     {
        //         publication: this.pubData,
        //         mainEntityUuids: this.mainEntityUuids,
        //         selectedFiles: filePaths,
        //         revision: true,
        //         revisionText: this.revisionText,
        //         revisionAuthors: this.authors,
        //         status: 'publishing'
        //     }
        // ).then((resp) => {
        //     this.ui.success = true;
        //     this.ui.submitted = true;
        //     this.ui.loading = false;
        // }, (error) => {
        //     this.ui.error = true;
        //     this.ui.submitted = true;
        //     this.ui.loading = false;
        // });
    }

    navigate(destCompName) {
        let params = {
            projectId: this.projectId,
            publication: this.publication,
            selectedListing: this.selectedListing
        }
        this.$state.go(destCompName, params, { reload: true });
    }

    goStart() {
        this.navigate('projects.pipelineStart');
    }
    
    goSelection() {
        this.navigate(this.ui.selectionComp);
    }

    goCitation() {
        this.navigate(this.ui.citationComp);
    }

    goProject() {
        this.navigate('projects.view');
    }
}

export const VersionChangesComponent = {
    template: VersionChanges,
    controller: PipelineVersionChangesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
