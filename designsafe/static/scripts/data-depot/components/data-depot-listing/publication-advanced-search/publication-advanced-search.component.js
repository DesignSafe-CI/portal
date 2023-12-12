import publicationAdvancedSearchTemplate from './publication-advanced-search.template.html';
const facilityJson = require('../../../../projects/components/facility-data.json');
const { simulationTypes } = require('../../../../projects/components/manage-simulations/simulation-types.json');
const { nhTypes } = require('../../../../projects/components/manage-project/project-form-options.json');
const { otherTypes } = require('../../../../projects/components/manage-project/project-form-options.json');

class PublicationAdvancedSearchCtrl {
    constructor($state, $stateParams) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
    }
    $onInit() {
        this.experimentOptions = facilityJson;
        this.experimentFacilityOptions = [
            { name: '', label: 'All Types' },
            ...facilityJson.experimentalFacility.experimental.map(({ label }) => ({ name: label, label: label })),
        ];
        this.simulationTypes = [{ name: '', label: 'All Types' }, ...simulationTypes];

        this.rapidEventTypes = nhTypes.map((type) => ({ name: type, label: type }));
        this.rapidEventTypes = [{ name: '', label: 'All Types' }, ...this.rapidEventTypes];

        this.otherTypes = otherTypes.map((type) => ({ name: type, label: type }));
        this.otherTypes = [{ name: '', label: 'All Types' }, ...this.otherTypes];

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
                author: '',
                title: '',
                keyword: '',
                description: '',
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
    getValidExperimentTypes(reset) {
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
}
export const publicationAdvancedSearchComponent = {
    controller: PublicationAdvancedSearchCtrl,
    template: publicationAdvancedSearchTemplate,
};
