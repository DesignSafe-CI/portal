import _ from 'underscore';
import FilesListingTemplate from './files-listing.template.html';
import PublicationsListingTemplate from './publications-listing.template.html';
import PublicationsLegacyListingTemplate from './publications-legacy-listing.template.html';
const exptJson = require('../../../projects/components/manage-experiments/experimental-data.json');
const { simulationTypes } = require('../../../projects/components/manage-simulations/simulation-types.json');
const { nhTypes, frTypes } = require('../../../projects/components/manage-project/project-form-options.json');
const { otherTypes } = require('../../../projects/components/manage-project/project-form-options.json');

class PublicationListingCtrl {
    constructor($state, PublicationService, $stateParams, $uibModal){
        'ngInject';
        this.$state = $state;
        this.PublicationService = PublicationService;
        this.$stateParams = $stateParams;
        this.$uibModal = $uibModal;
    }
    $onInit() {
        this.experimentOptions = exptJson;
        this.experimentFacilityOptions = [
            { name: '', label: 'All Types' },
            ...exptJson.experimentalFacility.experimental.map(({ label }) => ({ name: label, label: label })),
        ];
        this.simulationTypes = [{ name: '', label: 'All Types' }, ...simulationTypes];

        this.rapidEventTypes = nhTypes.map((type) => ({ name: type, label: type }));
        this.rapidEventTypes = [{ name: '', label: 'All Types' }, ...this.rapidEventTypes];

        this.frTypes = frTypes.filter(t => t !== 'Something Else').map((type) => ({ name: type, label: type }));
        this.frTypes = [{ name: '', label: 'All Types' }, ...this.frTypes];

        this.otherTypes = otherTypes.map((type) => ({ name: type, label: type }));
        this.otherTypes = [{ name: '', label: 'All Types' }, ...this.otherTypes];

        this.currentYear = new Date(Date.now()).getUTCFullYear();
        //Show events going back 10 years
        this.datesInRange = []
        for (var i = this.currentYear; i >=2015; i--) {
            this.datesInRange.push(i);
        }
        this.nhYears = this.datesInRange.map((type) => ({ name: type, label: type }));
        this.nhYears = [{ name: '', label: 'All Years' }, ...this.nhYears];

        this.hybridSimulationTypes = [
            { name: '', label: 'All Types' },
            {
                name: 'Earthquake',
                label: 'Earthquake',
            },
            {
                name: 'Wind',
                label: 'Wind',
            },
            {
                name: 'Other',
                label: 'Other',
            },
        ];

        const currentParams =
            this.$stateParams.query_string && JSON.parse(decodeURIComponent(this.$stateParams.query_string));
        if (currentParams)
            currentParams.advancedFilters.experimental.experimentalFacility =
                currentParams.advancedFilters.experimental.experimentalFacility.label;

        this.params = currentParams || {
            queries: {
                searchString: '',
                publicationYear: '',
            },
            typeFilters: {
                experimental: false,
                simulation: false,
                field_recon: false,
                other: false,
                hybrid_simulation: false,
            },
            advancedFilters: {
                experimental: {
                    experimentType: '',
                    experimentalFacility: '',
                },
                simulation: {
                    simulationType: '',
                },
                field_recon: {
                    naturalHazardType: '',
                    naturalHazardEvent: '',
                    frType: '',
                    frDate: ''
                },
                other: {
                    dataType: '',
                },
                hybrid_simulation: {
                    hybridSimulationType: '',
                },
            },
        };

        this.validExperimentTypes = {};
        this.getValidExperimentTypes(false);
        this.isCollapsed = true;
        Object.keys(this.params.advancedFilters).forEach((key) => {
            Object.values(this.params.advancedFilters[key]).forEach((value) => {
                if (value) {
                    this.isCollapsed = false;
                }
            });
        });
    }
    getValidExperimentTypes(reset, browse) {
        if (reset) this.params.advancedFilters.experimental.experimentType = '';
        const facilityLabel = this.params.advancedFilters.experimental.experimentalFacility;
        const facilityName = (
            this.experimentOptions.experimentalFacility.experimental.filter((x) => x.label === facilityLabel)[0] || {}
        ).name;

        if (facilityName) {
            this.validExperimentTypes = [
                { name: '', label: 'All Types' },
                ...this.experimentOptions.experimentTypes[facilityName],
            ];
        } else {
            this.validExperimentTypes = [{ name: '', label: 'All Types' }];
        }
        

        if (browse) this.browse();
    }
    toggleSearchPanel(e) {
        e.preventDefault();
        this.isCollapsed = !this.isCollapsed;
    }
    toggleFilter(type) {
        this.params.typeFilters[type] = !this.params.typeFilters[type];

        // null out advanced filters if type filter is deselected
        !this.params.typeFilters[type] &&
            Object.keys(this.params.advancedFilters[type]).forEach((key) => {
                this.params.advancedFilters[type][key] = '';
            });
        this.browse();
    }
    constructQueryString() {
        const facilityLabel = this.params.advancedFilters.experimental.experimentalFacility;
        const facilityName = (
            this.experimentOptions.experimentalFacility.experimental.filter((x) => x.label === facilityLabel)[0] || {}
        ).name;
        const queryParams = { ...this.params };
        queryParams.advancedFilters.experimental.experimentalFacility = {
            name: facilityName || '',
            label: this.params.advancedFilters.experimental.experimentalFacility,
        };
        return encodeURIComponent(JSON.stringify(queryParams));
    }
    browse() {
        this.$state.go('publicData', { query_string: this.constructQueryString() }, { reload: true });
    }
    cancel() {
        this.$state.go('publicData', { query_string: null }, { reload: true, inherit: false, location: true });
    }
    
    href(publication) {
        let path = (publication.revision
            ? `${publication.projectId}v${publication.revision}`
            : publication.projectId
        )
        return this.$state.href('publishedData', {filePath: path})
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
    constructor($state, FileListingService, Django, FileOperationService, PublicationService) {
        'ngInject';
        this.$state = $state;
        this.FileListingService = FileListingService;
        this.Django = Django;
        this.FileOperationService = FileOperationService;
        this.PublicationService = PublicationService;
        this.handleScroll = this.handleScroll.bind(this);
    }

    $onInit() {
    }

    handleScroll() {
        if (!this.listing.reachedEnd) {
            const { section, api, scheme, system, path } = this.listing.params;
            this.FileListingService.browseScroll({ section, api, scheme, system, path });
        }
    }

    browse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        this.onBrowse({ file });
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
    }
    isNotebook(file) {
        const extension = file.name.split('.').pop();
        return extension === 'ipynb';
    }
    hasNotebooks() {
        const listing = this.FileListingService.listings.main.listing;
        if (!listing || window.location.href.includes('agave')) return false;

        const pyNb = listing.filter(this.isNotebook);
        if (_.isEmpty(pyNb)) return false;
        return true;
    }
    openInApp(file) {
        const params = {
            system: this.FileListingService.listings.main.params.system,
            loc: this.$state.current.name,
            path: file.path,
            projectId: this.PublicationService.current ? this.PublicationService.current.projectId : null
        };
        return this.FileOperationService.openInJupyter(params);
    };

    isInTrash() {
        if (this.listing.params.path && this.listing.params.system) {
            let filePath = this.listing.params.path.split('/');
            if (this.listing.params.system == 'designsafe.storage.default' &&
                filePath[1] == '.Trash')
                return true;
            else if (filePath[0] == '.Trash')
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
        editTags: '<', 
        published: '<'
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
};
