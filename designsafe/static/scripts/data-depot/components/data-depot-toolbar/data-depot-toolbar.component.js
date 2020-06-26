import dataDepotToolbarTemplate from './data-depot-toolbar.component.html'

class DataDepotToolbarCtrl {
    constructor($state, $uibModal, Django, DataBrowserService, UserService) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.$state = $state;
        this.search = { queryString: '' };
        this.browser = DataBrowserService.state();
        this.UserService = UserService;

        this.tests = {};

        this.apiParams = DataBrowserService.apiParameters();

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
            'projects.view.data': 'Project Data View',
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

    details() {
        // preview the last selected file or current listing if none selected
        if (this.browser.selected.length > 0) {
            this.DataBrowserService.preview(this.browser.selected.slice(-1)[0]);
        } else {
            this.DataBrowserService.preview(this.browser.listing);
        }
    }
    download() {
        this.DataBrowserService.download(this.browser.selected);
    }
    preview() {
        this.DataBrowserService.preview(this.browser.selected[0], this.browser.listing);
    }
    previewImages() {
        const images = this.browser.selected.filter(({ path }) => {
            const ext = path.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'tiff', 'gif'].indexOf(ext) !== -1;
        });
        const folders = this.browser.selected.filter(({ format }) => format === 'folder');
        if (folders.length) {
            Promise.all(folders.map((folder) => folder.fetch())).then((responses) => {
                for (const res of responses) {
                    const output = res.children.filter(({ path }) => {
                        const ext = path.split('.').pop().toLowerCase();
                        return ['jpg', 'jpeg', 'png', 'tiff', 'gif'].indexOf(ext) !== -1;
                    });
                    images.push(...output);
                }
                this.DataBrowserService.previewImages(images);
            });
        } else {
            this.DataBrowserService.previewImages(images);
        }
    }
    showCitation() {
        this.DataBrowserService.showCitation(this.browser.selected, this.browser.listing);
    }
    viewMetadata() {
        this.DataBrowserService.viewMetadata(this.browser.selected, this.browser.listing);
    }
    viewCategories() {
        this.DataBrowserService.viewCategories(this.browser.selected, this.browser.listing);
    }
    share() {
        this.DataBrowserService.share(this.browser.selected[0]);
    }
    copy() {
        this.DataBrowserService.copy(this.browser.selected);
    }
    move() {
        this.DataBrowserService.move(this.browser.selected, this.browser.listing);
    }
    rename() {
        this.DataBrowserService.rename(this.browser.selected[0]);
    }
    trash() {
        this.DataBrowserService.trash(this.browser.selected);
    }
    rm() {
        this.DataBrowserService.rm(this.browser.selected);
    }
    ddSearch() {
        var state = this.apiParams.searchState;
        this.$state.go(state, {
            'query_string': this.search.queryString,
            'systemId': this.browser.listing.system,
        });
    }
}

DataDepotToolbarCtrl.$inject = ['$state', '$uibModal', 'Django', 'DataBrowserService', 'UserService'] 


export const DataDepotToolbarComponent = {
    controller: DataDepotToolbarCtrl,
    controllerAs: '$ctrl',
    template: dataDepotToolbarTemplate
}
