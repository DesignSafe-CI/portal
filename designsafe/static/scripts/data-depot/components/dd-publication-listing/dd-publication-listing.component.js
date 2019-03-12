class ddPublicationListingController {
    constructor($stateParams) {
        this.$stateParams = $stateParams;
    }
}
const ddPublicationListingComponent = {
    template: require('./dd-publication-listing.template.html'),
    controller: ddPublicationListingController,
    bindings: {
        browser: '<',
        queryString: '<',
        onBrowse: '&',
        onSelect: '&',
        renderPath: '&',
        renderName: '&',
        scrollToBottom: '&',
        scrollToTop: '&',
        showDescription: '&',
        typeFilter: '&',
        clearFilters: '&',
        areFiltersEmpty: '&',
        toggles: '=',
    }
}

export default ddPublicationListingComponent