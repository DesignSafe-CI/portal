export default class ImageOverlayModalCtrl {

    constructor ($scope, $uibModalInstance) {
        'ngInject';
        this.$scope = $scope;
        this.$uibModalInstance = $uibModalInstance;
        this.data = {
            file: null,
            url: null,
            min_lat: null,
            max_lat: null,
            min_lon: null,
            max_lon: null
        };
    }

    ok () {
        this.$uibModalInstance.close(this.data);
    }

    cancel () {
        this.$uibModalInstance.dismiss('cancel');
    }
}
