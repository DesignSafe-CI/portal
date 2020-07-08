import publicationAdvancedSearchTemplate from './publication-advanced-search.template.html'
const exptJson = require('../../../../projects/components/manage-experiments/experimental-data.json')
const { simulationTypes } = require('../../../../projects/components/manage-simulations/simulation-types.json') 

class PublicationAdvancedSearchCtrl {
    constructor($state, $stateParams) {
        'ngInject'
        this.$state = $state;
        this.$stateParams = $stateParams;
    }
    $onInit() {
        this.experimentOptions = exptJson;
        this.simulationTypes = simulationTypes;
        this.rapidEventTypes = [
            'Other',
            'Earthquake',
            'Flood',
            'Hurricane',
            'Landslide',
            'Tornado',
            'Tsunami'
        ];
        this.otherTypes = [
            'Custom',
            'Code',
            'Database',
            'Dataset',
            'Image',
            'Jupyter Notebook',
            'Learning Object',
            'Model',
            'Paper',
            'Proceeding',
            'Poster',
            'Presentation',
            'Report',
            'REU',
            'Social Sciences',
            'Softwarem',
            'Survey',
            'Video',
            'White Paper',
        ];
        this.hybridSimulationTypes = [
            {
                name: 'Earthquake',
                label: 'Earthquake'
            },
            {
                name: 'Wind',
                label: 'Wind'
            },
            {
                name: 'Other',
                label: 'Other'
            }
        ];

        const currentParams = this.$stateParams.query_string && JSON.parse(
            decodeURIComponent(this.$stateParams.query_string)
            );

        this.params = currentParams || {
            queries: {
                author: '',
                title: '',
                keyword: '',
                description: ''
            },
            typeFilters: {
                experimental: false,
                simulation: false,
                field_recon: false,
                other: false,
                hybrid_simulation: false 
            },
            advancedFilters: {
                experimental: {
                    experimentType: null,
                    experimentalFacility: null
                },
                simulation: {
                    simulationType: null
                },
                field_recon: {
                    naturalHazardType: null,
                    naturalHazardEvent: null
                },
                other: {
                    dataType: null
                },
                hybrid_simulation: {
                    hybridSimulationType: null
                }
            }

        }
        this.isCollapsed = false;

    }
    getValidExperimentTypes() {
        const facilityLabel = this.params.advancedFilters.experimental.experimentalFacility
        const facilityName = (this.experimentOptions.experimentalFacility.experimental.filter(x => x.label === facilityLabel)[0] || {}).name
        if (facilityName) {
            return this.experimentOptions.experimentTypes[facilityName]
        }
        return []

    }
    toggleSearchPanel(e) {
        e.preventDefault()
        this.isCollapsed = !this.isCollapsed
    }
    toggleFilter(type) {
        this.params.typeFilters[type] = !this.params.typeFilters[type]
    }
    constructQueryString() {
        return encodeURIComponent(JSON.stringify(this.params))
    }
    browse() {
        this.$state.go('publicData', {query_string: this.constructQueryString()}, {reload: true})
    }
    cancel() {
        this.$state.go('publicData', { query_string: null }, { reload: true, inherit: false, location: true })
    }
}
export const publicationAdvancedSearchComponent = {
    controller: PublicationAdvancedSearchCtrl,
    template:  publicationAdvancedSearchTemplate

};