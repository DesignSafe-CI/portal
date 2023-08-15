import workspaceDataBrowserTemplate from './workspace-data-browser.template.html';
class WorkspaceDataBrowserCtrl {
    constructor($rootScope, FileListingService, FileOperationService, ProjectService, PublicationService, Django) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.ProjectService = ProjectService;
        this.PublicationService = PublicationService;
        this.Django = Django;
    }

    $onInit() {
        this.requestKey = '';
        this.wants = {};
        this.listingType = 'files'; // one of 'files', 'projects', 'publications', 'nees'

        this.options = [
            { name: 'myData', label: 'My Data' },
            { name: 'myProjects', label: 'My Projects' },
            { name: 'publications', label: 'Published' },
            { name: 'nees', label: 'Published (NEES)' },
            { name: 'communityData', label: 'Community Data' },
        ];
        this.breadcrumbParams = this.FileListingService.fileMgrMappings.agave.breadcrumbParams;
        this.selectedOption = 'myData';
        this.initialParams = {
            section: 'main',
            api: 'agave',
            scheme: 'private',
            system: 'designsafe.storage.working',
            path: this.Django.user,
        };

        this.FileListingService.browse(this.initialParams);

        this.$rootScope.$on('wants-file', ($event, wantArgs) => {
            this.requestKey = wantArgs.requestKey;
            this.wants = { title: wantArgs.title, description: wantArgs.description };
        });

        this.$rootScope.$on('cancel-wants-file', ($event, wantArgs) => {
            this.requestKey = '';
            this.wants = {};
        });
    }

    onSelect() {
        switch (this.selectedOption) {
            case 'myData':
                this.listingType = 'files';
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'designsafe.storage.working',
                    path: this.Django.user,
                });
                this.breadcrumbParams = this.FileListingService.fileMgrMappings.agave.breadcrumbParams;
                break;
            case 'myProjects':
                this.listingType = 'projects';
                this.ProjectService.listProjects({ section: 'main' });
                break;
            case 'publications':
                this.listingType = 'publications';
                this.PublicationService.listPublications({});
                break;
            case 'nees':
                this.listingType = 'nees';
                this.PublicationService.listLegacyPublications({});
                break;
            case 'communityData':
                this.listingType = 'files';
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'community',
                    system: 'designsafe.storage.community',
                    path: '',
                });
                this.breadcrumbParams = this.FileListingService.fileMgrMappings.community.breadcrumbParams;
                break;
        }
    }

    onBrowseFiles(file) {
        const scheme = this.FileListingService.listings.main.params.scheme;
        const { system, path } = file;
        if (file.type === 'dir' || file.type === 'folder') {
            this.FileListingService.browse({ section: 'main', api: 'agave', scheme, system, path });
        } else {
            this.FileOperationService.openPreviewModal({ file, api: 'agave', scheme });
        }
    }

    onBrowseProject(project) {
        this.listingType = 'files';
        this.breadcrumbParams = {
            skipRoot: false,
            customRoot: { label: project.value.projectId + " - " + project.value.title, path: '' },
            preRoot: { label: 'My Projects', onBrowse: () => (this.listingType = 'projects') },
        };

        this.FileListingService.browse({
            section: 'main',
            api: 'agave',
            scheme: 'private',
            system: `project-${project.uuid}`,
            path: '',
        });
    }

    onBrowsePublication(publication) {
        this.listingType = 'files';
        this.breadcrumbParams = {
            skipRoot: true,
            customRoot: { label: publication.projectId, path: publication.projectId },
            preRoot: { label: 'Publications', onBrowse: () => (this.listingType = 'publications') },
        };
        this.FileListingService.browse({
            section: 'main',
            api: 'agave',
            scheme: 'public',
            system: 'designsafe.storage.published',
            path: publication.projectId,
        });
    }

    onBrowseNees(publication) {
        this.listingType = 'files';
        this.breadcrumbParams = {
            skipRoot: true,
            customRoot: { label: publication.project, path: publication.project },
            preRoot: { label: 'Publications (NEES)', onBrowse: () => (this.listingType = 'nees') },
        };
        this.FileListingService.browse({
            section: 'main',
            api: 'agave',
            scheme: 'public',
            system: 'nees.public',
            path: publication.project,
        });
    }
}

export const WorkspaceDataBrowser = {
    controller: WorkspaceDataBrowserCtrl,
    template: workspaceDataBrowserTemplate,
};
