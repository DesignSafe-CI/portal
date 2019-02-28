const ddPublicationListingComponent = {
    template: require('./dd-publication-listing.template.html'),
    bindings: {
        browser: '<',
        queryString: '<',
        onBrowse: '&',
        onSelect: '&',
        renderPath: '&',
        renderName: '&',
        scrollToBottom: '&',
        scrollToTop: '&',
    }
}

export default ddPublicationListingComponent