import _ from 'underscore';
import { uuid } from 'uuidv4';
import DataDepotBrowserTemplate from './data-depot-browser.component.html';
import DataDepotPublicationTemplate from './data-depot-browser.publications.component.html';
import DataDepotPublicationLegacyTemplate from './data-depot-browser-publications-legacy.template.html';

class DataDepotPublicationsBrowserCtrl {
    constructor($state, $stateParams, $window, Django, PublicationService) {
        'ngInject';
        this.$state = $state;
        this.Django = Django;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.PublicationService = PublicationService;
        this.$window = $window;
    }

    $onInit() {
        this.PublicationService.listPublications({query_string: this.$stateParams.query_string});
    }
}

class DataDepoPublicationsLegacyBrowserCtrl {
    constructor($state, $stateParams, $window, Django, PublicationService) {
        'ngInject';
        this.$state = $state;
        this.Django = Django;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.PublicationService = PublicationService;
        this.$window = $window;
    }

    $onInit() {
        this.PublicationService.listLegacyPublications({query_string: this.$stateParams.query_string});
        
    }
}


class DataDepotBrowserCtrl {
    constructor($state, $stateParams, $window, FileListingService, FileOperationService, $http, Django, $scope) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.$http = $http;
        this.$scope = $scope;
        this.Django = Django;
        this.$window = $window;

    }

    $onInit() {
        
        this.section = 'main';
        this.api = this.FileListingService.fileMgrMappings[this.apiParams.fileMgr].api;
        this.breadcrumbParams = this.FileListingService.fileMgrMappings[this.apiParams.fileMgr].breadcrumbParams;
        this.scheme = this.FileListingService.fileMgrMappings[this.apiParams.fileMgr].scheme;
        const system = this.$stateParams.systemId || 'external';
        const path = this.$stateParams.filePath
        if (system === 'designsafe.storage.community') {
            this.exclude = ['.Trash']
        }

        this.offset = 0;
        this.limit = 15;
        const queryString = this.$stateParams.query_string;
        this.FileListingService.browse({section: this.section, api: this.api, scheme: this.scheme, system, path, query_string: queryString, exclude: this.exclude});
    }

    onBrowse(file) {
        if (file.type === 'dir' || file.type === 'folder') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, ''), query_string: null});
            return;
        }
        if (this.api === 'googledrive') {
            this.openLinkInTab(file._links.self.href);
            return;
        }
        else {
            this.FileOperationService.openPreviewModal({file, api: this.api, scheme: this.scheme})
        }
    }

    openLinkInTab(href) {
        this.$window.open(href, '_blank')
    }
}

export const DataDepotBrowserComponent = {
    controller: DataDepotBrowserCtrl,
    controllerAs: '$ctrl',
    template: DataDepotBrowserTemplate,
    bindings: {
        apiParams: '<',
        path: '<',
    },
};


export const DataDepotPublicationsBrowserComponent = {
    controller: DataDepotPublicationsBrowserCtrl,
    controllerAs: '$ctrl',
    template: DataDepotPublicationTemplate,
    bindings: {
        apiParams: '<',
        path: '<',
    },
};


export const DataDepotPublicationsLegacyBrowserComponent = {
    controller: DataDepoPublicationsLegacyBrowserCtrl,
    controllerAs: '$ctrl',
    template: DataDepotPublicationLegacyTemplate,
    bindings: {
        apiParams: '<',
        path: '<',
    },
};
