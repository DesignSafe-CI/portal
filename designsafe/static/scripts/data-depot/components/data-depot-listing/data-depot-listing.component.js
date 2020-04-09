import _ from 'underscore';
import FilesListingTemplate from './files-listing.template.html';
import PublicationsListingTemplate from './publications-listing.template.html';

class FilesListingCtrl {
    constructor($state, DataBrowserService, $stateParams, $uibModal){
        'ngInject';
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
        this.renderName = this.renderName.bind(this);
    }

    $onInit() {
        if (typeof this.params === 'undefined') {
            this.params = {
                showSelect: true,
                showHeader: true,
                showTags: false,
                editTags: false,
            };
        }
        this._ui = {
            loading: false,
            error: false,
            showSelect: this.params.showSelect,
            showHeader: this.params.showHeader,
            showTags: this.params.showTags,
            editTags: this.params.editTags,
        };
        this.state = this.DataBrowserService.state();
        this.bread = (path, system) => {
            if (!path) {
                return;
            }
            if (path === '/') {
                this.breadcrumbs = [''];
            } else {
                this.breadcrumbs = path.split('/');
            }

            if (system === 'designsafe.storage.default' ||
                system === 'designsafe.storage.published' ||
                system === 'nees.public') {
                this.breadcrumbs.shift();
            }
        };
        this.listing = () => {
            if (this.filesList != null && typeof this.filesList != 'undefined') {
                this.bread(this.filesList.path, this.filesList.system);
                return this.filesList;
            } else if (this.browser.listing != null && typeof this.browser.listing != 'undefined') {
                this.bread(this.browser.listing.path, this.browser.listing.system);
                return this.browser.listing;
            }
        };
    }

    breadcrumbBrowse($event, path) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        let systemId = this.browser.listing.system || this.browser.listing.systemId;
        let stateName = this.$state.current.name;
        let filePath = '';
        let version = 1;
        for (var i = 0; i < this.breadcrumbs.length; i++) {
            filePath = filePath.concat(this.breadcrumbs[i] + '/');
            if (this.breadcrumbs[i] === path) { break; }
        }
        return this.$state.go(
            stateName,
            {
                systemId: systemId,
                filePath: filePath,
                version: version,
                query_string: null
            },
            { reload: true }
        );
    }

    onBrowse($event, file) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        let systemId = file.system || file.systemId;
        let stateName = this.$state.current.name;
        let filePath;
        if (stateName === 'googledriveData') {
            filePath = file.id;
        } else if (file.path == '/') {
            filePath = file.path + file.name;
        } else {
            filePath = file.path;
        }
        if (file.type !== 'dir' && file.type !== 'folder') {
            return this.DataBrowserService.preview(
                file, this.browser.listing
            );
        }
        let version = 1;
        if (file.system === 'nees.public') {
            stateName = 'neesPublished';
        } else if (file.system === 'designsafe.storage.published') {
            stateName = 'publishedData.view';
            if (file.version) {
                version = file.version;
            }
        }
        return this.$state.go(
            stateName,
            {
                systemId: systemId,
                filePath: filePath,
                version: version,
                query_string: null
            },
            { reload: true }
        );
    }

    selectAll () {
        let deselect = false;
        this.listing().children.forEach((file) => {
            if (typeof file._ui === 'undefined') {
                file._ui = { selected: false };
            }
            if (file._ui.selected === true){
                deselect = true;
            }
        });
        if (deselect) {
            this.DataBrowserService.deselect(this.listing().children);
        } else {
            this.DataBrowserService.select(this.listing().children, false);
        }
    }

    onSelect($event, file) {
        if ($event.shiftKey && this.browser.selected.length > 0) {
            const lastFile = this.browser.selected[this.browser.selected.length - 1];
            const lastIndex = this.browser.listing.children.indexOf(lastFile);
            const fileIndex = this.browser.listing.children.indexOf(file);
            const min = Math.min(lastIndex, fileIndex);
            const max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(this.browser.listing.children.slice(min, max + 1));
        } else {
            const selectedIndex = this.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        }
    }

    scrollToBottom() {
        return this.DataBrowserService.scrollToBottom({ queryString: this.$stateParams.query_string, typeFilters: this.$stateParams.typeFilters, });
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

    getType(meta) {
        if (typeof meta.dataType != 'undefined' && meta.dataType != 'None') {
            return meta.dataType;
        } 
        if (meta.type === 'field_recon') {
            return 'Field Research';
        }
        if (meta.type === 'hybrid_simulation') {
            return 'Hybrid Simulation';
        }
        return meta.type;
        
    }

    showDescription(title, description) {
        var modal = this.$uibModal.open({
            component: 'publicationDescriptionModalComponent',
            resolve: {
                title: () => title,
                description: () => description,
            },
            size: 'lg'
        });
    }

    onTypeFilterSelect(typeFilter) {
        //Need to handle typeFilters being array, string, or undefined
        let typeFilters = this.$stateParams.typeFilters || []; 
        typeFilters = [typeFilters].flat();

        if (typeFilters.includes(typeFilter)) {
            typeFilters = typeFilters.filter((x) => x != typeFilter);
        } else {
            typeFilters.push(typeFilter);
        }
        if (typeFilters.length === 0) {
            typeFilters = null;
        }
        this.$state.go(this.$state.current, { typeFilters: typeFilters }, { reload: true });
    }

    checkTypeFilterSelected(typeFilter) {
        let typeFilters = this.$stateParams.typeFilters || []; 
        typeFilters = [typeFilters].flat();
        return typeFilters.includes(typeFilter);
    }

    clearTypeFilters() {
        this.$state.go(this.$state.current, { typeFilters: null }, { reload: true });
    }
}

export const FilesListingComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: FilesListingTemplate,
    bindings: {
        browser: '=',
        filesList: '=',
        params: '<',
    },
};

export const PublicationsListingComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: PublicationsListingTemplate,
    bindings: {
        browser: '=',
        filesList: '=',
    },
};
