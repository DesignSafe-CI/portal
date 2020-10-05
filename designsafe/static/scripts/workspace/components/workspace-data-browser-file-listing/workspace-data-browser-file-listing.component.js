import workspaceDataBrowserFileListingTemplate from './workspace-data-browser-file-listing.template.html';
class WorkspaceDataBrowserFileListingCtrl {
    constructor($rootScope, FileListingService, ProjectService, PublicationService, Django) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.FileListingService = FileListingService;
        this.ProjectService = ProjectService;
        this.PublicationService = PublicationService;
        this.Django = Django;
    }

    $onInit() {

    }

    browse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        this.onBrowse({ file })
    }

    chooseFile(file) {
        this.$rootScope.$broadcast('provides-file', { requestKey: this.requestKey, path: `agave://${file.system}/${file.path}` });
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
}

export const WorkspaceDataBrowserFileListing = {
    controller: WorkspaceDataBrowserFileListingCtrl,
    template: workspaceDataBrowserFileListingTemplate,
    bindings: {
        listing: '<',
        selectable: '<',
        onSelect: '<',
        onBrowse: '&',
        onScroll: '&',
        requestKey: '<'
    }
};
