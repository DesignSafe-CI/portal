import _ from 'underscore';
import FilesListingTemplate from './files-listing.template.html';
import FilesListingPublicTemplate from './files-listing.public.template.html';

class FilesListingCtrl {
    constructor($state, DataBrowserService, $stateParams, $uibModal){
        'ngInject';
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;

        this.areFiltersEmpty = this.areFiltersEmpty.bind(this)
        this.typeFilter = this.typeFilter.bind(this)
        this.renderName = this.renderName.bind(this)
        this.clearFilters = this.clearFilters.bind(this)
    }

    $onInit() {
        this._ui = { loading: false, error: false };
        this.bread = (path, system) => {
            if (!path) {
                return;
            }
            if (path === '/') {
                this.breadcrumbs = [''];
            } else {
                this.breadcrumbs = path.split('/');
            }
            if (system === 'designsafe.storage.default') {
                this.breadcrumbs.shift();
            }
        };
        this.allowSelect = true;
        this.curationMode = () => {
            if (this.$state.current.name === 'projects.curation') {
                return true;
            }
            return false;
        };
        this.categoryList = () => {
            if (typeof this.categoryListing != 'undefined' && this.categoryListing === true) {
                return true;
            }
            return false;
        };
        this.categorySelect = () => {
            if (typeof this.categorySelection != 'undefined' && this.categorySelection === true) {
                return true;
            }
            return false;
        };
        this.listing = () => {
            if (this.categoryList() && (typeof this.filesList === 'undefined' || _.isEmpty(this.filesList))) {
                return;
            }
            if (typeof this.filesList === 'undefined' || _.isEmpty(this.filesList)){
                if (typeof this.browser.listing !== 'undefined' && this.browser.listing !== null) {
                    this.bread(this.browser.listing.path, this.browser.listing.system);
                }
                this.allowSelect = true;
                return this.browser.listing;
            }
            this.allowSelect = false;
            return this.filesList;
        };

        this.toggles = {
            experimental: false,
            simulation: false,
            hybrid: false,
            nees: false,
            other: false
        }
    }

    breadcrumbBrowse($event, path) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        let systemId = this.browser.listing.system || this.browser.listing.systemId;
        var filePath = '';
        for (var i = 0; i < this.breadcrumbs.length; i++) {
            filePath = filePath.concat(this.breadcrumbs[i] + '/');
            if (this.breadcrumbs[i] === path) { break; }
        }
        return this.$state.go(
            this.$state.current.name,
            { systemId: systemId, filePath: filePath }, { reload: true }
        );
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
            stateName = 'neesPublished';
        } else if (file.system === 'designsafe.storage.published') {
            stateName = 'publishedData';
        }
        return this.$state.go(
            stateName,
            { systemId: systemId, filePath: filePath }, { reload: true }
        );
    }

    selectAll () {
        if (this.browser.selected.length) {
            this.DataBrowserService.deselect(this.browser.listing.children);
        } else {
            this.DataBrowserService.select(this.browser.listing.children, true);
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

    showDescription(title, description) {
        var modal = this.$uibModal.open({
          component: 'publicationDescriptionModalComponent',
          resolve: {
            title: () => title,
            description: () => description,
          },
          size: 'lg'
        })
      }
      areFiltersEmpty() {
          let noneToggled = true
          for (const key of Object.keys(this.toggles)) {
              if (this.toggles[key]) {
                  noneToggled = false
              }
          }
          if (noneToggled) {
              return true
          }
          return false
      }
      typeFilter(item, x, y) {
          if (this.areFiltersEmpty()) {
              return true
          }
          if (item.metadata && this.toggles['nees']) {
              return true
          }
          return this.toggles[(item.meta || {}).type]; 
      }
      clearFilters() {
          for (const key of Object.keys(this.toggles)) {
              this.toggles[key] = false
          }
      }
}

export const FilesListingComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: FilesListingTemplate,
    bindings: {
        browser: '=',
        filesList: '=',
        categoryListing: '=',
        categorySelection: '=',
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
