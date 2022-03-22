import DownloadLargeTemplate from './download-large.component.html'
class DownloadLargeCtrl {
    constructor() {
    }
}

export const DownloadLargeModal = {
    template: DownloadLargeTemplate,
    controller: DownloadLargeCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}