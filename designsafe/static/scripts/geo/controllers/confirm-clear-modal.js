export default class ConfirmClearModalCtrl {

    constructor ($scope, $uibModalInstance) {
        'ngInject';
        this.$scope = $scope;
        this.$uibModalInstance = $uibModalInstance;
    }

    ok () {
        this.$uibModalInstance.close('ok');
    }

    cancel () {
        this.$uibModalInstance.dismiss('cancel');
    }
}
