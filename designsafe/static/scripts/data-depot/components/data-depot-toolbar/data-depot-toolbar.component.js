import dataDepotToolbarTemplate from './data-depot-toolbar.component.html'

class DataDepotToolbarCtrl {
    constructor($state, $uibModal, Django, UserService, FileListingService, FileOperationService) {
        'ngInject';
        this.$state = $state;
        this.search = { queryString: '' };
        this.UserService = UserService;
        this.FileListingService = FileListingService
        this.FileOperationService = FileOperationService
        this.tests = {};
        this.Django = Django;
    }

    placeholder() {
        var stateNames = {
            'myData': 'My Data',
            'projects.list': 'My Projects',
            'sharedData': 'Shared Data',
            'boxData': 'Box',
            'dropboxData': 'Dropbox',
            'googledriveData': 'Google Drive',
            'publicData': 'Published Projects',
            'communityData': 'Community Data',
            'projects.view': 'Project View',
            'projects.curation': 'Project Curation',
            'neesPublished': 'NEES Published',
            'publicDataLegacy': 'Published (NEES)'
        };

        if (stateNames[this.$state.current.name]) {
            return (stateNames[this.$state.current.name]);
        }
        else {
            return ('Data Depot');
        }
    };

    getAllSelected() {
        return Object.keys(this.FileListingService.listings).map(key => this.FileListingService.listings[key].selectedFiles).flat()
    }

    download() {
        const { api, scheme } = this.FileListingService.listings.main.params;
        const files = this.getAllSelected()[0];
        this.FileOperationService.download({api, scheme, files});
    }
    preview() {
        const { api, scheme } = this.FileListingService.listings.main.params;
        const file = this.getAllSelected()[0];
        this.FileOperationService.openPreviewModal({api, scheme, file});
    }
    previewImages() {
        const { api, scheme, system } = this.FileListingService.listings.main.params;
        const files = this.getAllSelected();
        this.FileOperationService.openImagePreviewModal({api, scheme, system, files});
    }
    copy() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = this.getAllSelected();
        this.FileOperationService.openCopyModal({api, scheme, system, path, files});
    }
    move() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = this.getAllSelected();
        this.FileOperationService.openMoveModal({api, scheme, system, path, files});
    }
    rename() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const file = this.getAllSelected()[0];
        this.FileOperationService.openRenameModal({api, scheme, system, path, file});
    }
    trash() {
        const { api, scheme } = this.FileListingService.listings.main.params;
        const files = this.getAllSelected();
        const trashPath = this.$state.current.name === 'myData' ?  `${this.Django.user}/.Trash` : '.Trash'
        this.FileOperationService.trash({api, scheme, files, trashPath});
    }
    rm() {
        this.FileOperationService.rm(this.browser.selected);
    }
    ddSearch() {
        this.$state.go(this.$state.current.name, {
            'query_string': this.search.queryString,
        });
    }
}


export const DataDepotToolbarComponent = {
    controller: DataDepotToolbarCtrl,
    controllerAs: '$ctrl',
    template: dataDepotToolbarTemplate
}
