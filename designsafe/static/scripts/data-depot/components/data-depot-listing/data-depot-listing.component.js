import _ from 'underscore';
import FilesListingTemplate from './files-listing.template.html';
import PublicationsListingTemplate from './publications-listing.template.html';
import PublicationsLegacyListingTemplate from './publications-legacy-listing.template.html';

class PublicationListingCtrl {
    constructor($state, PublicationService, $stateParams, $uibModal){
        'ngInject';
        this.$state = $state;
        this.PublicationService = PublicationService;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
    }

    href(publication) {
        return this.$state.href('publishedData', {filePath: publication.projectId})
    }

    showDescription(publication) {
        this.PublicationService.openDescriptionModal(publication.projectId, publication.project.value.title)
    }

    scrollToBottom() {
        !this.PublicationService.listing.reachedEnd && this.PublicationService.scrollPublications();
    }

    getType(type) {
        if (!type) {
            return 'Other';
        }
        if (type === 'field_recon') {
            return 'Field Research';
        }
        if (type === 'hybrid_simulation') {
            return 'Hybrid Simulation';
        }
        return type;
    }
}

class PublicationLegacyListingCtrl {
    constructor($state, PublicationService, $uibModal){
        'ngInject';
        this.$state = $state;
        this.PublicationService = PublicationService;
        this.$uibModal = $uibModal;
    }

    $onInit() {
    }
    href(publication) {
        return this.$state.href('neesPublished', {filePath: publication.path})
    }

    showDescription(publication) {
        this.PublicationService.openDescriptionModalLegacy(publication.project, publication.title)
    }

    scrollToBottom() {
        !this.PublicationService.listingLegacy.reachedEnd && this.PublicationService.scrollPublicationsLegacy({});
    }

}

class FilesListingCtrl {
    constructor($state, FileListingService) {
        'ngInject';
        this.$state = $state;
        this.FileListingService = FileListingService

        this.handleScroll = this.handleScroll.bind(this)
    }

    $onInit() {
    }

    handleScroll() {
        if (!this.listing.reachedEnd) {
            const { section, api, scheme, system, path } = this.listing.params;
            this.FileListingService.browseScroll({section, api, scheme, system, path})
        }
    }

    browse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        this.onBrowse({ file })
    }

    href(system, path) {
        const href = this.$state.href(this.$state.current.name, { systemId: system,  filePath: encodeURI(path.replace(/^\/+/, ''))})
        return decodeURI(href);
    }

    onSelect(idx) {
        this.FileListingService.select(this.listing.params.section, idx)
    }

    icon(name, type) {
        if (type === 'dir' || type === 'folder') {
            return 'fa-folder';
        }

        var ext = name.split('.').pop().toLowerCase();
        switch (ext) {
            case 'zip':
            case 'tar':
            case 'gz':
            case 'bz2':
                return 'fa-file-archive-o';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'tif':
            case 'tiff':
                return 'fa-file-image-o';
            case 'pdf':
                return 'fa-file-pdf-o';
            case 'doc':
            case 'docx':
                return 'fa-file-word-o';
            case 'xls':
            case 'xlsx':
                return 'fa-file-excel-o';
            case 'ppt':
            case 'pptx':
                return 'fa-file-powerpoint-o';
            case 'ogg':
            case 'webm':
            case 'mp4':
                return 'fa-file-video-o';
            case 'mp3':
            case 'wav':
                return 'fa-file-audio-o';
            case 'txt':
            case 'out':
            case 'err':
                return 'fa-file-text-o';
            case 'tcl':
            case 'sh':
            case 'json':
                return 'fa-file-code-o';
            case 'geojson':
            case 'kml':
            case 'kmz':
                return 'fa-map-o';
            default:
                return 'fa-file-o';
        }
    };

    isInTrash() {
        if (this.listing.params.path) {
            if (this.listing.params.path.split('/')[1] == '.Trash')
                return true;
        }
        return false;
    }
}

export const FilesListingComponent = {
    controller: FilesListingCtrl,
    controllerAs: '$ctrl',
    template: FilesListingTemplate,
    transclude: true,
    bindings: {
        onScroll: '&',
        onBrowse: '&',
        listing: '<',
        nested: '<',
        showSelect: '<', // Enable checkbox selection
        operationLabel: '<', //button text for move/copy operation.
        operation: '&', // Callback for move/copy operation.
        showTags: '<',
        editTags: '<'
    },
};

export const PublicationsListingComponent = {
    controller: PublicationListingCtrl,
    controllerAs: '$ctrl',
    template: PublicationsListingTemplate,
    bindings: {
        listing: '<'
    },
};

export const PublicationsLegacyListingComponent = {
    controller: PublicationLegacyListingCtrl,
    controllerAs: '$ctrl',
    template: PublicationsLegacyListingTemplate,
    bindings: {
        listing: '<'
    }
}
