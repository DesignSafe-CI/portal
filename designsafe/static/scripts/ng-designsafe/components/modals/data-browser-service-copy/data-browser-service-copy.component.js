import dataBrowserServiceCopyTemplate from './data-browser-service-copy.template.html';

class DataBrowserCopyCtrl {
    constructor(
        $scope,
        $state,
        $anchorScroll,
        $timeout,
        $location,
        Django,
        FileListingService,
        FileOperationService,
        ProjectService
    ) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$anchorScroll = $anchorScroll;
        this.Django = Django;

        this.$timeout = $timeout;
        this.$location = $location;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.ProjectService = ProjectService;

        this.successCallback = this.successCallback.bind(this);
    }

    $onInit() {
        const section = 'modal';
        const offset = 0;

        this.listingProjects = false;
        this.projectBreadcrumbs = {};
        this.options = [
            { api: 'agave', label: 'My Data' },
            { api: 'projects', label: 'My Projects' },
            { api: 'googledrive', label: 'Google Drive' },
            { api: 'box', label: 'Box' },
            { api: 'dropbox', label: 'Dropbox' },
        ];

        this.initialParams = {
            agave: { api: 'agave', scheme: 'private', system: 'designsafe.storage.working', path: this.Django.user },
            googledrive: { api: 'googledrive', scheme: 'private', system: 'googledrive', path: '' },
            box: { api: 'box', scheme: 'private', system: 'box', path: '' },
            dropbox: { api: 'dropbox', scheme: 'private', system: 'dropbox', path: '' },
            projects: {}, //Projects listings are handled by a different service
        };

        // User is not in a private system, default to My Data
        this.selectedOption = 'agave';
        this.breadcrumbParams = this.FileListingService.fileMgrMappings.agave.breadcrumbParams;
        const { api, scheme, system, path } = this.initialParams.agave;
        this.FileListingService.browse({ section, api, scheme, system, path, offset });

        /*
        else if(this.resolve.system.startsWith('project-')) {
            this.selectedOption = 'projects';
            const projectId = this.ProjectService.current.value.projectId;
            this.breadcrumbParams = {
                skipRoot: false,
                customRoot: { label: projectId, path: '' },
                preRoot: {label: 'My Projects', onBrowse: () => this.listingProjects = true}
            };
            const { api, scheme, system, path } = this.resolve
            this.FileListingService.browse({section, api, scheme, system, path, offset});
            
        }
        else {
            this.selectedOption = this.resolve.api;
            this.breadcrumbParams = this.FileListingService.fileMgrMappings[this.selectedOption].breadcrumbParams; 
            const { api, scheme, system, path } = this.resolve
            this.FileListingService.browse({section, api, scheme, system, path, offset});
            
        }
        */
    }

    onBrowse(file) {
        const section = 'modal';
        const offset = 0;
        const { api, system, scheme } = this.FileListingService.listings.modal.params;

        this.FileListingService.browse({ section, api, scheme, system, path: file.path, offset });
    }

    onBrowseProject($event, project) {
        this.listingProjects = false;

        this.breadcrumbParams = {
            skipRoot: false,
            customRoot: { label: project.value.projectId, path: '' },
            preRoot: { label: 'My Projects', onBrowse: () => (this.listingProjects = true) },
        };

        this.FileListingService.browse({
            section: 'modal',
            api: 'agave',
            scheme: 'private',
            system: `project-${project.uuid}`,
            path: '',
        });
    }

    successCallback() {
        this.$state.reload();
    }

    handleCopy(dest) {
        this.close();

        this.FileOperationService.handleCopy({
            srcApi: this.resolve.api,
            srcFiles: this.resolve.files,
            destApi: this.FileListingService.listings.modal.params.api,
            destSystem: dest.system,
            destPath: dest.path,
            successCallback: this.successCallback,
        });
    }

    handleFooterCopy() {
        this.handleCopy({
            system: this.FileListingService.listings.modal.params.system,
            path: this.FileListingService.listings.modal.params.path,
        });
    }

    handleChange() {
        const { api, scheme, system, path } = this.initialParams[this.selectedOption];
        const section = 'modal';
        const offset = 0;
        if (this.selectedOption === 'projects') {
            this.listingProjects = true; //Initial listing after selecting Projects in the dropdown will be a projects listing.
            return;
        }

        this.listingProjects = false;
        this.breadcrumbParams = this.FileListingService.fileMgrMappings[this.selectedOption].breadcrumbParams;
        this.FileListingService.browse({ section, api, scheme, system, path, offset });
    }

    getModalListing() {
        const srcSystem = this.resolve.files[0].system;
        const srcPaths = this.resolve.files.map((f) => f.path);
        this.FileListingService.listings.modal.listing = this.FileListingService.listings.modal.listing.filter(
            (f) => !(f.system === srcSystem && srcPaths.includes(f.path))
        );
        return this.FileListingService.listings.modal
    }   

    cancel() {
        this.dismiss();
    }
}

export const DataBrowserCopyModal = {
    template: dataBrowserServiceCopyTemplate,
    controller: DataBrowserCopyCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
