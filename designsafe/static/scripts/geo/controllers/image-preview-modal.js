export default class ImagePreviewModal {

    constructor ($scope, $uibModalInstance, GeoDataService, marker) {
        'ngInject';
        this.$scope = $scope;
        this.$uibModalInstance = $uibModalInstance;
        this.GeoDataService = GeoDataService;
        this.marker = marker;
        console.log('ImagePreviewModal', this.marker);
    }

    cancel () {
        this.$uibModalInstance.dismiss('cancel');
    }
}
