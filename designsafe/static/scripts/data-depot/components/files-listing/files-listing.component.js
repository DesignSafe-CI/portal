import _ from 'underscore';
import FilesListingTemplate from './files-listing.template.html';
import FilesListingPublicTemplate from './files-listing.public.template.html';

class FilesListingCtrl {
    constructor($state, DataBrowserService){
        'ngInject';
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this._ui = { loading: false, error: false };
        this.repeated = false;
        this.listing = () => {
            if (typeof this.filesList === 'undefined' || _.isEmpty(this.filesList)){
                return this.browser.listing;
            }
            this.repeated = true;
            return this.filesList;
        };
    }

    onBrowse($event, file) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        let systemId = file.system || file.systemId;
        let filePath;
        if (file.path == '/') {
            filePath = file.path + file.name;
        } else {
            filePath = file.path;
        }
        if (file.type !== 'dir' && file.type !== 'folder') {
            return this.DataBrowserService.preview(
                file, this.browser.listing
            );
        }
        let stateName = this.$state.current.name;
        if (file.system === 'nees.public') {
            stateName = 'publicData';
        } else if (file.system === 'designsafe.storage.published') {
            stateName = 'publishedData';
        }
        return this.$state.go(
            stateName,
            { systemId: systemId, filePath: filePath }, { reload: true }
        );
    }

    onSelect($event, file) {
        if ($event.ctrlKey || $event.metaKey) {
            const selectedIndex = this.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && this.browser.selected.length > 0) {
            const lastFile = this.browser.selected[this.browser.selected.length - 1];
            const lastIndex = this.browser.listing.children.indexOf(lastFile);
            const fileIndex = this.browser.listing.children.indexOf(file);
            const min = Math.min(lastIndex, fileIndex);
            const max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(this.browser.listing.children.slice(min, max + 1));
        } else if (typeof file._ui !== 'undefined' && file._ui.selected) {
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }
    }

    scrollToBottom() {
        return this.DataBrowserService.scrollToBottom();
    }

    renderName(file) {
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null ||
            _.isEmpty(file.metadata)){
            if(file.meta && file.meta.title){
                return file.meta.title;
            }
            return file.name;
        }
        const pathComps = file.path.split('/');
        const experiment_re = /^experiment/;
        if (file.path[0] === '/' && pathComps.length === 2) {
            return file.metadata.project.title;
        } else if (file.path[0] !== '/' &&
                 pathComps.length === 2 &&
                 experiment_re.test(file.name.toLowerCase())){
            return file.metadata.experiments[0].title;
        }
        return file.name;
    }

    onMetadata($event, file) {
        $event.stopPropagation();
        this.DataBrowserService.viewMetadata(
            [file],
            this.browser.listing
        );
    }
}

export const FilesListingComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: FilesListingTemplate,
    bindings: {
        browser: '=',
        filesList: '=',
    },
};

export const FilesListingPublicComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: FilesListingPublicTemplate,
    bindings: {
        browser: '=',
        filesList: '=',
    },
};
